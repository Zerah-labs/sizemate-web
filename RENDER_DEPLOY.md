# Deploy SizeMate on Render

This package includes a ready-to-use `render.yaml` and Dockerfile. **It has not yet been deployed to your Render account.**

## A. Deploy using Render Blueprint (recommended)

1. Extract `SizeMate-Render-Ready.zip`. The **contents** of its `sizemate-web` directory should be at the **root** of your GitHub repository, including `render.yaml` and `Dockerfile`.
2. Create a GitHub repository for the project and push the files. You may keep it private and authorize the Render GitHub App to read it.
3. Sign in at https://dashboard.render.com/ and connect your GitHub account to Render.
4. Choose **New > Blueprint**, choose the repository containing `render.yaml`, review the resources, then select **Deploy Blueprint**.
5. When deployment reports `Live`, open the service's HTTPS URL. Visit `https://<your-service>.onrender.com/health` to verify both ffmpeg and Ghostscript report `true`.
6. Upload a *small* JPG, PDF, and MP4 that you have permission to test. Ensure that each conversion returns a downloadable file.

## B. Deploy as a Docker Web Service

1. Create **New > Web Service** and select your connected GitHub repository.
2. Set language/runtime to **Docker** and Dockerfile path to `./Dockerfile` (provided the project files are at the repository root).
3. Region: Singapore. Instance: **Free** for testing, or **1c-2g** (paid) for more reliable heavy conversions.
4. Add environment variables: `PORT=8080`, `MAX_UPLOAD_MB=24`, `MAX_CONCURRENT_JOBS=1`.
5. Set Health Check Path to `/health`, then deploy.

## Things to know before publishing to customers

- The **Free** web service plan has 512 MB RAM and limited CPU, and sleeps after 15 minutes idle; conversion can be slow or fail for larger PDFs/videos. Treat it as a demo, not production. Plan `1c-2g` currently has 2 GB RAM and costs approximately $25/month before other possible usage fees. Always review Render's current billing before upgrading.
- Files are uploaded to the server temporarily. Do not claim that processing happens wholly on-device, and don't upload confidential files without a security/privacy assessment.
- The upload limit is **24 MB total per request**. There is no streaming large-file workflow, persistent task queue, or multi-instance rate limiting yet.
- If you place all files under a folder named `sizemate-web` *inside* your repository instead of at the root, use Render service root directory `sizemate-web` (and ensure your Blueprint path is configured), or move the files to the repository root.
- Use abuse controls, monitoring, restrictions on document content, and output timeouts before public marketing. Native FFmpeg/Ghostscript utilities can consume significant CPU/RAM and expose attack surface to untrusted file content.

Sources: https://render.com/docs/infrastructure-as-code and https://render.com/docs/blueprint-spec and https://render.com/docs/free
