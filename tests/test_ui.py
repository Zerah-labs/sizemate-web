"""Real-browser regression tests. Run after: playwright install chromium."""
import io
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest
from PIL import Image
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope='module')
def site():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    process = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app',
                                '--host', '127.0.0.1', '--port', str(port)], cwd=ROOT,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            if process.poll() is not None:
                pytest.fail('Test server exited before startup')
            with socket.socket() as sock:
                if sock.connect_ex(('127.0.0.1', port)) == 0:
                    break
            time.sleep(.1)
        else:
            pytest.fail('Test server did not start')
        yield f'http://127.0.0.1:{port}'
    finally:
        process.terminate()
        process.wait(timeout=10)


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as pw:
        channel = os.environ.get('SIZEMATE_BROWSER_CHANNEL')
        instance = pw.chromium.launch(channel=channel, headless=True)
        yield instance
        instance.close()


def photo(name='தமிழ் அறிக்கை.png'):
    buffer = io.BytesIO()
    Image.new('RGB', (320, 200), '#159689').save(buffer, 'PNG')
    return {'name': name, 'mimeType': 'image/png', 'buffer': buffer.getvalue()}


@pytest.mark.parametrize('width,height', [(320, 740), (390, 844), (768, 1024), (1366, 768)])
@pytest.mark.parametrize('language', ['en', 'ta'])
def test_responsive_conversion(browser, site, width, height, language, tmp_path):
    context = browser.new_context(viewport={'width': width, 'height': height},
                                  is_mobile=width < 540, has_touch=width < 540,
                                  accept_downloads=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    try:
        page.goto(site)
        expect(page.locator('#upload-limit')).to_contain_text('24')
        if language == 'ta':
            page.locator('#language-toggle').click()
        expect(page.locator('html')).to_have_attribute('lang', language)
        for tool in ['image', 'pdf', 'mp3', 'video', 'merge', 'photos-pdf']:
            page.locator(f'[data-tool="{tool}"]').click()
            expect(page.locator(f'[data-tool="{tool}"]')).to_have_attribute('aria-pressed', 'true')
            expect(page.locator('#convert-button')).to_be_disabled()
            assert page.locator('#preset-setting').is_visible() == (tool in ['image', 'video'])
            assert page.locator('#format-setting').is_visible() == (tool == 'image')
            assert page.locator('#bitrate-setting').is_visible() == (tool == 'mp3')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, language, tool)
        page.locator('[data-tool="image"]').click()
        # Verify the keyboard-accessible picker used on laptops and phones.
        with page.expect_file_chooser() as chooser:
            page.locator('#dropzone').press('Enter')
        chooser.value.set_files(photo())
        expect(page.locator('.file-name')).to_have_text('தமிழ் அறிக்கை.png')
        expect(page.locator('#convert-button')).to_be_enabled()
        if width < 540:
            box = page.locator('.file-actions button').bounding_box()
            assert box['width'] >= 44 and box['height'] >= 44
        page.locator('#convert-button').click()
        expect(page.locator('#result-panel')).to_be_visible(timeout=15000)
        expect(page.locator('#error-panel')).to_be_hidden()
        expect(page.locator('#download-link')).to_have_attribute('download', 'தமிழ் அறிக்கை-smaller.png')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        with page.expect_download() as downloaded:
            page.locator('#download-link').click()
        downloaded.value.save_as(tmp_path / 'output.png')
        assert Image.open(tmp_path / 'output.png').size == (320, 200)
        page.screenshot(path=str(tmp_path / f'{language}-{width}.png'), full_page=True)
        assert not errors
    finally:
        context.close()


@pytest.mark.parametrize('width', [320, 1366])
def test_order_remove_clear_and_validation(browser, site, width):
    page = browser.new_page(viewport={'width': width, 'height': 800})
    try:
        page.goto(site)
        page.locator('[data-tool="photos-pdf"]').click()
        page.locator('#file-input').set_input_files([photo('first.png'), photo('second.png')])
        page.locator('.file-actions button[title="Move up"]').nth(1).click()
        expect(page.locator('.file-name').first).to_have_text('second.png')
        page.locator('.file-actions button[title="Remove file"]').first.click()
        expect(page.locator('.file-name')).to_have_text('first.png')
        page.locator('#clear-files').click()
        expect(page.locator('#selected-area')).to_be_hidden()
        expect(page.locator('#convert-button')).to_be_disabled()
        page.locator('#file-input').set_input_files({'name': 'bad.txt', 'mimeType': 'text/plain', 'buffer': b'invalid'})
        expect(page.locator('#error-panel')).to_be_visible()
        expect(page.locator('#selected-area')).to_be_hidden()
    finally:
        page.close()
