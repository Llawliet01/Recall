# Use official lightweight Python image
FROM python:3.11-slim

# Install system dependencies required for OpenCV (PaddleOCR) and standard libraries
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    libxml2 \
    libxslt1-dev \
    zlib1g-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium binaries for bookmark scraping
RUN python -m playwright install chromium

# Copy backend application source files
COPY backend/app ./app

# Set environment variables
ENV FLAGS_use_onednn=0
ENV PORT=8000

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
