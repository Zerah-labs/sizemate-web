FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    MAX_UPLOAD_MB=24

# ffmpeg extracts audio / compresses video, Ghostscript shrinks PDF files.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ghostscript ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/

RUN useradd -m -u 10001 serviceuser && chown -R serviceuser:serviceuser /service
USER serviceuser
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1 --proxy-headers"]
