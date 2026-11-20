# ==============================================================================
# Production Dockerfile for ReviewGuard AI
# Multi-layer NLP & ML Fake Review Detection System
# ==============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=5000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system utilities & build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download NLTK Lexicon for instant container initialization
RUN python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"

# Copy application backend, datasets, and pre-built React frontend
COPY backend ./backend
COPY data ./data
COPY frontend/dist ./frontend/dist
COPY README.md .

# Expose server port
EXPOSE 5000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Launch unified server (FastAPI API + React Frontend)
CMD ["python", "backend/run_server.py"]
