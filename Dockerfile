# Run with docker-compose -f docker-compose.yml up -d

# Stage 1: Build assets with Node, avoid including JS dev dependencies in Python image
FROM node:22-slim as nodebuild

WORKDIR /app

# Copy only the files needed for Tailwind to work
COPY package*.json ./
RUN npm install

COPY ./assets ./assets

# Run Tailwind to generate CSS
RUN npm run build-tailwind

# Run ESBuild to bundle GSAP JS
RUN npm run build-alpine

# Run ESBuild to bundle GSAP JS
RUN npm run build-gsap

# Stage 2: Final image with Python
FROM python:3.11-slim

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser
WORKDIR /app

RUN apt-get update && apt-get install -y curl

ENV DATABASE_URL=sqlite:stats-data/stats.db

# Install DB mate for migration handling
RUN curl -fsSL https://github.com/amacneil/dbmate/releases/download/v2.27.0/dbmate-linux-amd64 -o /usr/local/bin/dbmate \
  && chmod +x /usr/local/bin/dbmate

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Tailwind built in other stage to avoid including dev dependencies
COPY --from=nodebuild /app/static/css/tailwind.css ./static/css/tailwind.css
# Copy project files
COPY . .

# Set up data directory
RUN mkdir -p stats-data && chown -R appuser:appuser stats-data

RUN dbmate up

# Use non-root user
USER appuser
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]