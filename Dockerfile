
FROM python:3.11-slim

RUN adduser --disabled-password --gecos "" appuser
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p stats-data && chown -R appuser:appuser stats-data

USER appuser
EXPOSE 5000

CMD ["python", "app.py"]
