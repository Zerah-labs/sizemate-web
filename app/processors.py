"""File operations. All inputs are temporary, local, user-uploaded files."""
from __future__ import annotations

import io
import shutil
import subprocess
import unicodedata
import zipfile
from dataclasses import dataclass
from pathlib import Path

import fitz
from PIL import Image, ImageOps, UnidentifiedImageError

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}
PDF_EXTS = {".pdf"}


class ProcessingError(Exception):
    """Safe processing failure to show in user interface."""


def safe_stem(filename: str) -> str:
    """Make a benign output filename, never an input path."""
    name = Path(filename.replace('\\', '/').split('/')[-1]).stem
    # Combining marks are essential to Tamil, Hindi and many other scripts.
    name = unicodedata.normalize('NFC', name)
    clean = ''.join(char for char in name
                    if unicodedata.category(char)[0] in {'L', 'M', 'N'}
                    or char in '_ -').strip(' ._-')
    return (clean or 'file')[:65]


def command(args: list[str], timeout: int = 180) -> None:
    try:
        process = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 timeout=timeout, check=False)
    except FileNotFoundError as exc:
        raise ProcessingError("Conversion service isn't installed on the server.") from exc
    except subprocess.TimeoutExpired as exc:
        raise ProcessingError("This file took too long to process. Try a shorter or smaller file.") from exc
    if process.returncode:
        detail = process.stderr.decode('utf-8', 'replace')[-900:]
        if 'moov atom not found' in detail or 'Invalid data found' in detail:
            raise ProcessingError("This video seems damaged or isn't a supported video file.")
        raise ProcessingError("Couldn't process this file. Please check it opens normally and try again.")


def image_as_rgb(image: Image.Image) -> Image.Image:
    if image.mode == 'RGB':
        return image
    if image.mode in ('RGBA', 'LA') or ('transparency' in image.info):
        rgba = image.convert('RGBA')
        background = Image.new('RGB', rgba.size, 'white')
        background.paste(rgba, mask=rgba.getchannel('A'))
        return background
    return image.convert('RGB')


def optimize_image(source: Path, dest: Path, preset: str, output_type: str = 'original',
                   max_width: int = 0) -> None:
    quality = {'small': 58, 'balanced': 76, 'quality': 90}[preset]
    try:
        with Image.open(source) as raw:
            if raw.width * raw.height > 80_000_000:
                raise ProcessingError("This photo is too large in dimensions to process safely.")
            raw.verify()
        with Image.open(source) as raw:
            im = ImageOps.exif_transpose(raw)
            im.load()
            if im.width * im.height > 80_000_000:
                raise ProcessingError("This photo is too large in dimensions to process safely.")
            if max_width and im.width > max_width:
                h = max(1, round(im.height * max_width / im.width))
                im = im.resize((max_width, h), Image.Resampling.LANCZOS)
            # For indexed & transparent PNGs, preserve alpha when using PNG / WebP.
            kind = output_type
            if kind == 'original':
                suffix = source.suffix.lower()
                kind = 'png' if suffix == '.png' else 'webp' if suffix == '.webp' else 'jpg'
            if kind == 'jpg':
                image_as_rgb(im).save(dest, 'JPEG', quality=quality, optimize=True, progressive=True)
            elif kind == 'webp':
                im.convert('RGBA' if 'A' in im.getbands() or 'transparency' in im.info else 'RGB').save(
                    dest, 'WEBP', quality=quality, method=5)
            elif kind == 'png':
                if im.mode not in ('RGB', 'RGBA', 'L', 'LA', 'P'):
                    im = im.convert('RGBA')
                # PNG is lossless; the preset doesn't change picture fidelity.
                im.save(dest, 'PNG', optimize=True, compress_level=9)
            else:
                raise ProcessingError('Choose JPG, PNG, or WebP for photos.')
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise ProcessingError("This photo couldn't be read. Try a JPG, PNG, or WebP image.") from exc
    # Avoid delivering an increased file size for same-format compression.
    same_format = (source.suffix.lower() in {'.jpg', '.jpeg'} and kind == 'jpg') or (source.suffix.lower() == f'.{kind}')
    if same_format and dest.stat().st_size >= source.stat().st_size and max_width == 0:
        shutil.copyfile(source, dest)


def optimize_pdf(source: Path, dest: Path, preset: str) -> None:
    # Preserve embedded fonts, glyph mappings and content streams. Re-distilling
    # through a printer driver can substitute fonts in multilingual documents.
    try:
        with fitz.open(source) as pdf:
            if pdf.needs_pass:
                raise ProcessingError('Please unlock your password-protected PDF before uploading.')
            if pdf.page_count == 0:
                raise ProcessingError('This PDF contains no pages.')
            pdf.save(dest, garbage=4, deflate=True, deflate_images=True,
                     deflate_fonts=True)
    except (fitz.FileDataError, fitz.EmptyFileError) as exc:
        raise ProcessingError("This PDF appears damaged or invalid.") from exc
    if not dest.exists() or dest.stat().st_size == 0:
        raise ProcessingError("Couldn't compress this PDF.")
    # Provide the original if lossless compression does not improve its size.
    if dest.stat().st_size >= source.stat().st_size:
        shutil.copyfile(source, dest)


def mp4_to_mp3(source: Path, dest: Path, bitrate: str = '192') -> None:
    command(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
             '-i', str(source), '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame',
             '-b:a', f'{bitrate}k', str(dest)], timeout=210)
    if not dest.exists() or dest.stat().st_size == 0:
        raise ProcessingError("The video doesn't contain an audio track.")


def compress_video(source: Path, dest: Path, preset: str) -> None:
    crf = {'small': '32', 'balanced': '28', 'quality': '23'}[preset]
    command(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
             '-i', str(source), '-map', '0:v:0', '-map', '0:a?',
             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf,
             '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
             '-movflags', '+faststart', str(dest)], timeout=230)
    if not dest.exists() or dest.stat().st_size == 0:
        raise ProcessingError("Couldn't compress this video.")
    if source.suffix.lower() == '.mp4' and dest.stat().st_size >= source.stat().st_size:
        shutil.copyfile(source, dest)


def merge_pdfs(sources: list[Path], dest: Path) -> None:
    if len(sources) < 2:
        raise ProcessingError('Select at least two PDFs to merge.')
    out = fitz.open()
    try:
        for source in sources:
            with fitz.open(source) as pdf:
                if pdf.needs_pass:
                    raise ProcessingError('Unlock password-protected PDFs before merging.')
                if pdf.page_count == 0:
                    raise ProcessingError('One of these PDFs has no pages.')
                out.insert_pdf(pdf, links=True, annots=True)
        out.save(dest, garbage=3, deflate=True)
    except (fitz.FileDataError, ValueError) as exc:
        raise ProcessingError("Couldn't merge one of the PDFs. Check that each PDF opens normally.") from exc
    finally:
        out.close()


def images_to_pdf(sources: list[Path], dest: Path) -> None:
    doc = fitz.open()
    try:
        for source in sources:
            try:
                with Image.open(source) as image:
                    if image.width * image.height > 80_000_000:
                        raise ProcessingError("One photo is too large to process safely.")
                    image = ImageOps.exif_transpose(image)
                    image.load()
                    if image.width * image.height > 80_000_000:
                        raise ProcessingError('One photo is too large to process safely.')
                    # Convert to JPEG to keep assembled PDFs smaller and predictable.
                    buf = io.BytesIO()
                    image_as_rgb(image).save(buf, 'JPEG', quality=85, optimize=True)
                    width, height = image.size
                    # Convert pixels to points using common 96ppi, bounding long edge to 842pt.
                    scale = min(1.0, 842.0 / max(width * 0.75, height * 0.75))
                    rect = fitz.Rect(0, 0, width * .75 * scale, height * .75 * scale)
                    page = doc.new_page(width=rect.width, height=rect.height)
                    page.insert_image(rect, stream=buf.getvalue())
            except (OSError, UnidentifiedImageError, Image.DecompressionBombError) as exc:
                raise ProcessingError('One photo could not be read.') from exc
        doc.save(dest, garbage=3, deflate=True)
    finally:
        doc.close()


def make_zip(files: list[Path], dest: Path) -> None:
    with zipfile.ZipFile(dest, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for file in files:
            archive.write(file, arcname=file.name)


@dataclass
class UploadEntry:
    path: Path
    name: str
    size: int


def output_ext_for_image(source: Path, chosen: str) -> str:
    if chosen == 'original':
        return '.png' if source.suffix.lower() == '.png' else '.webp' if source.suffix.lower() == '.webp' else '.jpg'
    return '.' + chosen
