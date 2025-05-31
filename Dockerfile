# Stage 1: Build assets with Node
FROM node:22-slim as nodebuild

WORKDIR /app

# Copy only the files needed for Tailwind to work
COPY package*.json ./
RUN npm install

COPY ./assets ./assets

# Run Tailwind to generate CSS
RUN npx tailwindcss -i ./assets/css/input.css -o ./static/css/tailwind.css --minify

# Stage 2: Final image with Python
FROM python:3.11-slim

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Tailwind built in other stage to avoid including dev dependencies
COPY --from=nodebuild /app/static/css/tailwind.css ./static/css/tailwind.css
# Copy project files
COPY . .

# Set up data directory
RUN mkdir -p stats-data && chown -R appuser:appuser stats-data

# Use non-root user
USER appuser
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]