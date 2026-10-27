"""SizeMate HTTP application; serves the site and its secure file utilities."""
from __future__ import annotations

import os
import shutil
import tempfile
import threading
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.background import BackgroundTask

from .processors import (
    IMAGE_EXTS, PDF_EXTS, VIDEO_EXTS, ProcessingError, UploadEntry,
    compress_video, images_to_pdf, make_zip, merge_pdfs, mp4_to_mp3,
    optimize_image, optimize_pdf, output_ext_for_image, safe_stem,
)

ROOT = Path(__file__).resolve().parent
MAX_UPLOAD_BYTES = int(os.environ.get('MAX_UPLOAD_MB', '24')) * 1_000_000
MAX_FILES = 12
# Free Render instances have limited RAM; cap simultaneous FFmpeg/Ghostscript work.
CONVERSION_SLOTS = threading.BoundedSemaphore(value=max(1, min(4, int(os.environ.get('MAX_CONCURRENT_JOBS', '1')))))
RATE_LOCK = threading.Lock()
RECENT_REQUESTS = defaultdict(deque)

app = FastAPI(title='SizeMate – File Compressor & Converter', version='1.0.0',
              docs_url=None, redoc_url=None, openapi_url=None)
app.mount('/static', StaticFiles(directory=ROOT / 'static'), name='static')


@app.middleware('http')
async def safety_headers(request: Request, call_next):
    if request.url.path == '/api/process':
        content_length = request.headers.get('content-length', '')
        if content_length.isdigit() and int(content_length) > MAX_UPLOAD_BYTES + 100_000:
            return JSONResponse({'detail': f'Files are too large. Select up to {MAX_UPLOAD_BYTES // 1_000_000} MB in total.'}, status_code=413)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; img-src 'self' blob: data:; "
        "script-src 'self'; style-src 'self'; font-src 'self'; "
        "connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
    )
    return response


@app.get('/')
def home():
    return FileResponse(ROOT / 'static' / 'index.html')


@app.get('/health')
def health():
    return {'status': 'ok', 'ffmpeg': bool(shutil.which('ffmpeg')),
            'ghostscript': bool(shutil.which('gs'))}


@app.get('/api/limits')
def limits():
    return {'max_total_mb': MAX_UPLOAD_BYTES // 1_000_000, 'max_files': MAX_FILES,
            'supported_tools': ['image', 'pdf', 'mp3', 'video', 'merge', 'photos-pdf']}


def check_rate_limit(client: str):
    now = time.monotonic()
    with RATE_LOCK:
        history = RECENT_REQUESTS[client]
        while history and now - history[0] > 600:
            history.popleft()
        if len(history) >= 20:
            raise HTTPException(429, 'Too many conversions. Try again in a few minutes.')
        history.append(now)
        if len(RECENT_REQUESTS) > 5000:
            for key in list(RECENT_REQUESTS.keys()):
                if not RECENT_REQUESTS[key] or now - RECENT_REQUESTS[key][-1] > 600:
                    del RECENT_REQUESTS[key]


def selected_extension(filename: str) -> str:
    return Path(filename.replace('\\', '/').split('/')[-1]).suffix.lower()


def unique_destination(folder: Path, name: str) -> Path:
    candidate = folder / name
    n = 2
    while candidate.exists():
        stem, ext = Path(name).stem, Path(name).suffix
        candidate = folder / f'{stem}-{n}{ext}'
        n += 1
    return candidate


def run_processing(tool: str, sources: list[UploadEntry], outputs: Path,
                   preset: str, image_format: str, max_width: int, bitrate: str) -> list[Path]:
    results: list[Path] = []
    if tool == 'merge':
        output = outputs / 'combined.pdf'
        merge_pdfs([item.path for item in sources], output)
        return [output]
    if tool == 'photos-pdf':
        output = outputs / 'photos.pdf'
        images_to_pdf([item.path for item in sources], output)
        return [output]
    for item in sources:
        stem = safe_stem(item.name)
        if tool == 'image':
            ext = output_ext_for_image(item.path, image_format)
            target = unique_destination(outputs, f'{stem}-smaller{ext}')
            optimize_image(item.path, target, preset, image_format, max_width)
        elif tool == 'pdf':
            target = unique_destination(outputs, f'{stem}-smaller.pdf')
            optimize_pdf(item.path, target, preset)
        elif tool == 'mp3':
            target = unique_destination(outputs, f'{stem}-audio.mp3')
            mp4_to_mp3(item.path, target, bitrate)
        elif tool == 'video':
            target = unique_destination(outputs, f'{stem}-smaller.mp4')
            compress_video(item.path, target, preset)
        else:
            raise ProcessingError('Please choose a tool.')
        results.append(target)
    return results


@app.post('/api/process')
def process(
    request: Request,
    files: Annotated[list[UploadFile], File(description='Files uploaded by the user')],
    tool: Annotated[str, Form()] = 'image',
    preset: Annotated[str, Form()] = 'balanced',
    image_format: Annotated[str, Form()] = 'original',
    max_width: Annotated[int, Form()] = 0,
    bitrate: Annotated[str, Form()] = '192',
):
    if tool not in {'image', 'pdf', 'mp3', 'video', 'merge', 'photos-pdf'}:
        raise HTTPException(400, 'Please choose an available tool.')
    if preset not in {'small', 'balanced', 'quality'}:
        raise HTTPException(400, 'Choose an available size setting.')
    if image_format not in {'original', 'jpg', 'png', 'webp'}:
        raise HTTPException(400, 'Choose an available image format.')
    if max_width not in {0, 640, 1024, 1600, 2048}:
        raise HTTPException(400, 'Choose an available image width.')
    if bitrate not in {'96', '128', '192', '256'}:
        raise HTTPException(400, 'Choose an available sound quality.')
    if not files or len(files) > MAX_FILES:
        raise HTTPException(400, f'Select between 1 and {MAX_FILES} files.')
    if tool == 'merge' and len(files) < 2:
        raise HTTPException(400, 'Select at least 2 PDFs to merge.')
    if not CONVERSION_SLOTS.acquire(blocking=False):
        raise HTTPException(503, 'SizeMate is busy at the moment. Please retry shortly.')
    workspace = Path(tempfile.mkdtemp(prefix='sizemate-'))
    try:
        client_ip = request.client.host if request.client else 'unknown'
        check_rate_limit(client_ip)
        incoming = workspace / 'incoming'
        outgoing = workspace / 'outgoing'
        incoming.mkdir()
        outgoing.mkdir()
        total = 0
        originals: list[UploadEntry] = []
        wanted = IMAGE_EXTS if tool in {'image', 'photos-pdf'} else PDF_EXTS if tool in {'pdf', 'merge'} else VIDEO_EXTS
        for index, upload in enumerate(files):
            filename = upload.filename or ''
            ext = selected_extension(filename)
            if ext not in wanted:
                raise HTTPException(400, f'"{safe_stem(filename)}" is not a supported file for this tool.')
            dest = incoming / f'upload-{index}{ext}'
            with dest.open('wb') as f:
                while chunk := upload.file.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_UPLOAD_BYTES:
                        raise HTTPException(413, f'Please select files smaller than {MAX_UPLOAD_BYTES // 1_000_000} MB in total.')
                    f.write(chunk)
            if dest.stat().st_size == 0:
                raise HTTPException(400, f'"{safe_stem(filename)}" is empty.')
            originals.append(UploadEntry(dest, filename, dest.stat().st_size))
        try:
            results = run_processing(tool, originals, outgoing, preset, image_format, max_width, bitrate)
        except ProcessingError as exc:
            raise HTTPException(422, str(exc)) from exc
        except Exception as exc:
            # No stack traces or sensitive local paths revealed to uploaders.
            raise HTTPException(422, 'This file could not be processed. Try a different file.') from exc
        if len(results) > 1:
            finished = workspace / 'sizemate-files.zip'
            make_zip(results, finished)
        else:
            finished = results[0]
        if not finished.is_file() or not finished.stat().st_size:
            raise HTTPException(422, 'No output could be created from this file.')
        size = finished.stat().st_size
        response = FileResponse(
            finished, media_type='application/octet-stream', filename=finished.name,
            background=BackgroundTask(shutil.rmtree, workspace, ignore_errors=True),
            headers={'X-Original-Bytes': str(total),
                     'X-Output-Bytes': str(size),
                     'X-Files-Processed': str(len(files)),
                     'Access-Control-Expose-Headers': 'X-Original-Bytes, X-Output-Bytes, X-Files-Processed, Content-Disposition'},
        )
        return response
    except Exception:
        shutil.rmtree(workspace, ignore_errors=True)
        raise
    finally:
        CONVERSION_SLOTS.release()
