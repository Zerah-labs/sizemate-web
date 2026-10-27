"""Integration tests exercising actual ImageMagick-free conversions, Ghostscript and ffmpeg."""
from __future__ import annotations

import io
import subprocess
import shutil
from pathlib import Path
from urllib.parse import unquote

import fitz
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    from app.main import RECENT_REQUESTS
    RECENT_REQUESTS.clear()


def picture(ext='JPEG', dims=(1200, 900)):
    image = Image.new('RGB', dims, (110, 182, 169))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(image)
    for i in range(200):
        draw.line((0, i*4, 1199, i*4+50), fill=(i%255, 60, 210), width=2)
    buf=io.BytesIO()
    image.save(buf, ext, quality=94)
    return buf.getvalue()


def sample_pdf(text='FIRST PAGE'):
    doc=fitz.open()
    page=doc.new_page()
    page.insert_text((70,70), text, fontsize=24)
    result=doc.tobytes()
    doc.close()
    return result


@pytest.fixture(scope='module')
def sample_video(tmp_path_factory):
    path=tmp_path_factory.mktemp('media') / 'clip.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',
       'color=c=blue:s=320x180:r=15:d=1.4','-f','lavfi','-i',
       'sine=frequency=440:duration=1.4','-c:v','libx264','-c:a','aac','-shortest',str(path)],
       check=True, capture_output=True)
    return path.read_bytes()


def send(tool, inputs, **options):
    files=[('files',(name,io.BytesIO(content),'application/octet-stream')) for name,content in inputs]
    return client.post('/api/process',data={'tool':tool,**options},files=files)


def test_site_and_health():
    assert client.get('/').status_code==200
    assert 'SizeMate' in client.get('/').text
    assert client.get('/static/style.css').status_code==200
    assert client.get('/static/app.js').status_code==200
    assert client.get('/api/limits').json()['max_files']==12
    health=client.get('/health').json()
    assert health['status'] == 'ok'
    assert health['ffmpeg'] == bool(shutil.which('ffmpeg'))


def test_compress_jpeg():
    original=picture()
    result=send('image',[('test-picture.jpg',original)],preset='small')
    assert result.status_code==200, result.text
    assert 'test-picture-smaller.jpg' in result.headers['content-disposition']
    assert len(result.content) <= len(original)
    assert Image.open(io.BytesIO(result.content)).format=='JPEG'


def test_webp_output():
    result=send('image',[('landscape.png',picture('PNG'))],image_format='webp',preset='balanced',max_width='640')
    assert result.status_code==200, result.text
    image=Image.open(io.BytesIO(result.content))
    assert image.format=='WEBP' and image.width==640


def test_pdf_compress():
    original=sample_pdf()
    result=send('pdf',[('contract.pdf',original)])
    assert result.status_code==200, result.text
    output=fitz.open(stream=result.content,filetype='pdf')
    assert output.page_count==1
    assert 'FIRST PAGE' in output[0].get_text()
    assert len(result.content)<=len(original)
    output.close()


def test_merge_pdf_order():
    result=send('merge',[('a.pdf',sample_pdf('ALPHA')),('b.pdf',sample_pdf('BETA'))])
    assert result.status_code==200, result.text
    output=fitz.open(stream=result.content,filetype='pdf')
    assert output.page_count==2
    assert 'ALPHA' in output[0].get_text()
    assert 'BETA' in output[1].get_text()
    output.close()


def test_photos_to_pdf():
    result=send('photos-pdf',[('a.jpg',picture()),('b.png',picture('PNG', (350,200)))])
    assert result.status_code==200, result.text
    output=fitz.open(stream=result.content,filetype='pdf')
    assert output.page_count==2
    assert output[0].get_images()
    output.close()


def test_mp3_conversion(sample_video):
    result=send('mp3',[('clip.mp4',sample_video)],bitrate='128')
    assert result.status_code==200, result.text
    assert result.content.startswith(b'ID3') or result.content[:2]==b'\xff\xfb'
    assert 'clip-audio.mp3' in result.headers['content-disposition']


def test_video_compress(sample_video):
    result=send('video',[('clip.mp4',sample_video)],preset='small')
    assert result.status_code==200, result.text
    assert b'ftyp' in result.content[:16]
    assert 'clip-smaller.mp4' in result.headers['content-disposition']


def test_multiple_photos_zip():
    result=send('image',[('a.jpg',picture()),('b.jpg',picture())])
    assert result.status_code==200, result.text
    import zipfile
    with zipfile.ZipFile(io.BytesIO(result.content)) as z:
        assert len(z.namelist())==2
        assert all(name.endswith('.jpg') for name in z.namelist())


def test_errors():
    assert send('merge',[('one.pdf',sample_pdf())]).status_code==400
    assert send('image',[('bad.pdf',sample_pdf())]).status_code==400
    assert send('mp3',[('bad.mp4',b'not video')]).status_code==422
    assert send('image',[('fake.jpg',b'not photo')]).status_code==422


def test_filename_sanitized():
    result=send('image',[('../../../../unsafe<script>.jpg',picture())])
    assert result.status_code==200, result.text
    assert 'script' in result.headers['content-disposition']
    assert '/' not in result.headers['content-disposition']


@pytest.mark.parametrize('name', ['தமிழ் அறிக்கை', 'हिन्दी रिपोर्ट', '中文文件', 'العربية'])
def test_unicode_download_and_zip_names(name):
    result = send('image', [(name + '.jpg', picture())])
    assert result.status_code == 200
    assert name + '-smaller.jpg' in unquote(result.headers['content-disposition'])
    result = send('image', [(name + '.jpg', picture()), (name + '.jpg', picture())])
    assert result.status_code == 200
    import zipfile
    with zipfile.ZipFile(io.BytesIO(result.content)) as archive:
        assert archive.namelist() == [name + '-smaller.jpg', name + '-smaller-2.jpg']


@pytest.mark.parametrize('tool', ['pdf', 'merge'])
def test_tamil_pdf_preserves_rendering_text_and_fonts(tool):
    font = next((path for path in [Path('C:/Windows/Fonts/Nirmala.ttc'),
                Path('/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf')]
                 if path.exists()), None)
    if font is None:
        pytest.skip('Tamil fixture requires Nirmala or Noto Sans Tamil')
    with fitz.open() as doc:
        page = doc.new_page()
        page.insert_font(fontname='tamil', fontfile=str(font))
        page.insert_text((40, 100), 'தமிழ் அறிக்கை हिन्दी', fontname='tamil', fontsize=22)
        original = doc.tobytes()
    with fitz.open(stream=original, filetype='pdf') as before:
        expected_text = before[0].get_text()
        assert 'தமிழ்' in expected_text
        expected_pixels = before[0].get_pixmap().samples
        font_bytes = [before.extract_font(f[0])[3] for f in before[0].get_fonts()]
    inputs = [('தமிழ்.pdf', original)]
    if tool == 'merge':
        inputs.append(('second.pdf', sample_pdf()))
    result = send(tool, inputs)
    assert result.status_code == 200, result.text
    if tool == 'pdf':
        assert len(result.content) < len(original)
    with fitz.open(stream=result.content, filetype='pdf') as after:
        assert after[0].get_text() == expected_text
        assert after[0].get_pixmap().samples == expected_pixels
        assert [after.extract_font(f[0])[3] for f in after[0].get_fonts()] == font_bytes


def test_size_limit(monkeypatch):
    import app.main as main
    monkeypatch.setattr(main,'MAX_UPLOAD_BYTES',10)
    result=send('image',[('large.png',picture('PNG'))])
    assert result.status_code==413
