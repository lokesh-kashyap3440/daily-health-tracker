# ─────────────────────────────────────────────────────────────────────────────
# Daily Health Tracker -- Backend Dockerfile
# Multi-stage Python build for the FastAPI application and suggestion worker.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required by psycopg2, bcrypt, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Default command: run the FastAPI ASGI server.
# Overridden by docker-compose for the suggestion-worker service.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
