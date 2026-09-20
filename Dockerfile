FROM python:3.12-alpine

WORKDIR /app
COPY . /app

RUN mkdir -p /data

ENV HOST=0.0.0.0 \
    PORT=8769 \
    SITE_ROOT=/app \
    LIKES_DB=/data/likes.sqlite3

EXPOSE 8769

CMD ["python3", ".server/server.py"]
