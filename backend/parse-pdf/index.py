"""
Парсинг PDF-выписок: читает файл из S3 по ключу, извлекает текст через pypdf (быстро).
Отдельная функция для больших файлов (64+ страниц).
"""
import json
import os
import base64
import io
import boto3


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Employee-Token",
}


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    """Парсит PDF из S3 через pypdf и возвращает текст."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    raw_body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw_body = base64.b64decode(raw_body).decode("utf-8")
    body = json.loads(raw_body)

    headers = event.get("headers") or {}
    token = (
        headers.get("x-employee-token")
        or headers.get("X-Employee-Token")
        or body.get("token")
        or ""
    )
    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет токена"})}

    s3_key = body.get("s3_key", "")
    if not s3_key:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "s3_key обязателен"})}

    # Читаем PDF из S3
    try:
        s3 = get_s3()
        obj = s3.get_object(Bucket="files", Key=s3_key)
        raw_bytes = obj["Body"].read()
        s3.delete_object(Bucket="files", Key=s3_key)
    except Exception as e:
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": f"S3 ошибка: {e}"}, ensure_ascii=False)}

    # Парсим текст через pypdf — намного быстрее pdfplumber для текстовых PDF
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(raw_bytes))
        total_pages = len(reader.pages)
        text_pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t and t.strip():
                text_pages.append(t.strip())
        full_text = "\n\n".join(text_pages)
        if not full_text.strip():
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"text": "", "pages": total_pages,
                                        "warning": "PDF не содержит текста — возможно, скан"}, ensure_ascii=False)}
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"text": full_text, "pages": total_pages}, ensure_ascii=False)}
    except Exception as e:
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": f"Ошибка парсинга PDF: {e}"}, ensure_ascii=False)}
