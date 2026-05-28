# Use a lightweight official Python runtime
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

# Set work directory inside the container
WORKDIR /app

# Install system dependencies needed for image processing and basic compiling
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to leverage Docker layer caching
COPY backend/requirements.txt /app/requirements.txt

# Install PyTorch CPU version first, then build other dependencies to save container space
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch open_clip_torch --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source files
COPY backend /app/backend

# Expose port
EXPOSE 7860

# Set working directory to the backend directory for executing python main.py
WORKDIR /app/backend

# Command to run application using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
