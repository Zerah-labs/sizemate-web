# SizeMate — File Compressor & Converter

A mobile-friendly, bilingual (English + Tamil) website for non-technical users to make files smaller and convert them. Includes six **working server-side tools**:

| Tool | Input | Output |
|---|---|---|
| Shrink Photos | JPG, JPEG, PNG, WebP, BMP, TIFF | JPG / PNG / WebP, optionally resized |
| Shrink PDFs | PDF | Lossless PDF compression; preserves existing fonts and text |
| Video to MP3 | MP4, MOV, MKV, WebM, AVI, M4V | MP3 with selectable bitrate |
| Shrink Videos | MP4, MOV, MKV, WebM, AVI, M4V | H.264 MP4 |
| Join PDFs | 2–12 PDFs | One merged PDF, ordered as selected |
| Photos to PDF | 1–12 images | One multi-page PDF |

For multiple independent conversions, results come back in a ZIP file. All operations run on the server, not in the user's browser. This is **not** an offline-only website; an internet connection is required for hosted use.

## Run locally (Windows, macOS, Linux)

Install Python 3.12+, **FFmpeg** first. Ensure `ffmpeg` is available in PATH for video and audio tools. PDF compression uses PyMuPDF and does not require Ghostscript.

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit **http://localhost:8000**.

### Recommended: Docker (same setup on Windows and cloud)

```bash
docker build -t sizemate .
docker run --rm -p 8080:8080 -e MAX_UPLOAD_MB=24 sizemate
```

Visit **http://localhost:8080**.

## Host on Render

The package includes a ready-to-use Render Blueprint (`render.yaml`). Push the **contents** of this folder to a GitHub repository and choose **Render Dashboard → New → Blueprint → select repo → Deploy Blueprint**. For manual Docker Web Service setup, see [RENDER_DEPLOY.md](RENDER_DEPLOY.md). Free compute is intended for **demos** only; conversion-heavy customer traffic needs stronger paid infrastructure and safeguards.

## Host on Google Cloud Run

Requirements: a Google Cloud project with billing enabled, `gcloud` CLI signed in, and permission to deploy Cloud Run services.

```bash
gcloud config set project YOUR_GOOGLE_CLOUD_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud run deploy sizemate \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 2 \
  --timeout 300 \
  --max-instances 3 \
  --set-env-vars MAX_UPLOAD_MB=24
```

**Deployment URL:** After deployment, Cloud Run prints the public HTTPS URL (`https://sizemate-....a.run.app`). Open it on a phone or computer.

**Windows PowerShell:** The same command is one line, or replace the trailing `\` line continuations with backticks (`` ` ``).

**Important Cloud Run upload limitation:** Many Cloud Run HTTP/1 requests have a **32 MiB** request-body limit, so we intentionally default to **24 MB total per conversion**. For large video files, implement **direct-to-cloud-storage uploads** before raising the limit (or choose a host supporting larger body uploads). A web UI alone cannot bypass a provider's upload restriction.

For a custom domain: Cloud Run → your service → **Integrations / Custom Domains**, or use a load balancer/domain mapping as supported by your region. Follow the provider's current instructions for DNS and TLS. Don't point DNS until the website is deployed and running.

### Other hosting services

The repo contains a standard `Dockerfile`, so you can connect it to Render, Railway, Fly.io, or another container-capable host. Select **Docker** as the deployment method, set 2 GB RAM and a suitable timeout/file upload limit, then set `MAX_UPLOAD_MB` accordingly. Hosting isn't guaranteed free: CPU-intensive PDF and video conversion uses computing resources and providers may charge.

## Test the product

```bash
pip install pytest httpx
pytest -q
```

Tests use real JPG/PNG/PDF/video files, lossless PDF compression and FFmpeg conversion. All six tools have integration tests.

## Features for non-technical customers

- Six simple task cards; no technical knowledge required.
- Click-to-upload and drag-and-drop; mobile responsive.
- Presets: Smallest file / Recommended / Best quality.
- Optional image width and format conversion.
- MP3 quality options.
- Order controls for merging PDFs and turning photos into one PDF.
- Batch conversion with ZIP output.
- Original vs new size and percentage saved, where meaningful.
- Tamil / English interface switch for primary UI.
- Basic protection against oversized uploads and too many jobs.
- No accounts, third-party trackers, or external file storage.
- Uploads are written to the server's temporary directory, processed, then removed after successful download response delivery; errors are cleaned up. Abrupt server termination or broken connections can leave temporary data until the instance is recycled. Do not advertise confidential-data guarantees without a privacy review.

## Important caveats

- **Not every file can be made smaller**; compressed inputs may not shrink further. Same-format JPG, PNG, PDF, and MP4 use original output when conversion increases size.
- Merging PDFs and extracting MP3 may produce a file of any size; they aren't size reducers.
- Ghostscript PDF compression can alter annotations, forms, transparency, embedded features, and **invalidates digital signatures**. Do not use with signed/legal originals without checking.
- Converting a PNG photo to JPEG will remove transparency and may reduce visual quality. PNG conversion remains lossless.
- The automatic cleanup happens after sending the response; it's not a claim of browser-only processing or guaranteed deletion after interrupted requests.
- This MVP has no login or billing. A widely advertised public deployment will need a persistent rate limiter, abuse detection, stronger quotas, telemetry without file content, and scalable job processing.

## Architecture

**HTML/CSS/vanilla JS → FastAPI → Pillow / PyMuPDF / Ghostscript / FFmpeg → direct file download.** One container, no database or API keys needed.

Environment variables: `MAX_UPLOAD_MB` (decimal megabytes; default 24), `MAX_CONCURRENT_JOBS` (1–4, default 1 for memory-constrained instances). Limits apply to all files in a single conversion combined; maximum 12 files per request.

### Optional deployment scripts

From the extracted project directory, Windows users may run:

```powershell
.\deploy-cloudrun.ps1 -ProjectId YOUR_GOOGLE_CLOUD_PROJECT_ID
```

macOS/Linux users may run:

```bash
bash deploy-cloudrun.sh YOUR_GOOGLE_CLOUD_PROJECT_ID
```

These scripts deploy a **public** application. Check your Google Cloud billing and quota settings before making the site widely available.

## Multilingual files

Unicode filenames (including Tamil, Hindi, Chinese and Arabic) are retained in downloads and ZIP files. PDF compression preserves existing embedded fonts, glyph mappings and selectable text using lossless compression. PDF quality presets are not applied; size savings may be smaller. This does not repair text that is already garbled or fonts missing from the original PDF. Photos remain images; no OCR or text retyping is performed.

## Automated checks

Install development dependencies with `python -m pip install -r requirements-dev.txt`, then install the test browser with `python -m playwright install chromium`. Ensure FFmpeg is on PATH. For the Tamil PDF regression test, install Nirmala (Windows) or Noto Sans Tamil (Linux).

Run `python -m pytest -q tests --basetemp=.test-artifacts` to check all six conversion tools, multilingual filenames and PDFs, and browser layouts at 320, 390, 768 and 1366 pixels in English and Tamil. Browser checks cover keyboard file selection, image conversion and download, file ordering, removal, clearing, validation, and mobile touch targets. These emulate screen sizes; they do not replace testing on physical iOS and Android devices.

To use installed Chrome instead of the downloaded Chromium, set `SIZEMATE_BROWSER_CHANNEL=chrome`. Screenshots are saved under `.test-artifacts/`. GitHub Actions runs the same suite on pushes and pull requests and uploads screenshots.

## Vercel deployment

Vercel detects `app/main.py` as a FastAPI application. `vercel.json` configures the function duration and excludes tests, local environments and the original ZIP. FFmpeg is available through the bundled `imageio-ffmpeg` package when the host has no system FFmpeg.

The Vercel demo allows **4 MB total uploads and 4 MB downloads** because Vercel Functions enforce a 4.5 MB payload limit. The interface reads and displays the hosted limits. Local and Docker deployments keep the 24 MB upload default. Files exceeding the hosted output limit return a clear message. Supporting larger files on Vercel requires direct object-storage uploads and downloads.

Connect the Vercel project to `Zerah-labs/sizemate-web`, production branch `main`, to enable automatic deployments from GitHub. Deployment credentials stay outside the repository.
