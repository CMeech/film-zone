#!/bin/bash
set -e

# Apply database migrations
echo "Running database migrations..."
dbmate up

# Start your Flask app
if [ "$FLASK_ENV" = "development" ]; then
  echo "Starting app with Python (dev mode)..."
  exec flask run --host=0.0.0.0 --port=5000 --debug
else
  echo "Starting app with Gunicorn..."
  exec gunicorn -b 0.0.0.0:5000 app:app
fi