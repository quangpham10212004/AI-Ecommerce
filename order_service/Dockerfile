FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DEFAULT_TIMEOUT 1000
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --retries 10 -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]
