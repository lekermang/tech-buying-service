"""
Одноразовый утилитарный endpoint: качает изображение по URL, ресайзит в PNG нужных размеров через Pillow и кладёт в S3.
Используется для генерации PNG-иконок PWA из AI-сгенерированных JPG.
"""
import json
import os
import io
import boto3
import requests
from PIL import Image
from botocore.client import Config as BotoConfig

S3_BUCKET = 'files'
S3_ENDPOINT = 'https://bucket.poehali.dev'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Content-Type': 'application/json; charset=utf-8',
}


def _s3():
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=BotoConfig(signature_version='s3v4'),
    )


def _resp(payload, status=200):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Конвертирует список URL в PNG и заливает в S3."""
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    items = body.get('items') or []

    # Preset для PWA-иконок стаффа (one-shot). Если items пустой — конвертируем preset.
    if not items:
        items = [
            {'url': 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/19a72e00-6824-42b3-a490-8196839f91e4.jpg', 'key': 'staff-pwa/icon-512.png', 'size': 512},
            {'url': 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/19a72e00-6824-42b3-a490-8196839f91e4.jpg', 'key': 'staff-pwa/icon-192.png', 'size': 192},
            {'url': 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/58d833f8-89bb-44e2-acb4-069756f1eec8.jpg', 'key': 'staff-pwa/icon-512-maskable.png', 'size': 512},
            {'url': 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/264de378-d33a-4d23-ad02-7e5751009f7a.jpg', 'key': 'staff-pwa/shortcut-repair.png', 'size': 96},
            {'url': 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a9b83886-d395-4529-bde6-5073e7953249.jpg', 'key': 'staff-pwa/shortcut-chat.png', 'size': 96},
            {'url': 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9c489570-cd42-4634-9930-d3dbf66329ca.jpg', 'key': 'staff-pwa/shortcut-gold.png', 'size': 96},
        ]

    s3 = _s3()
    results = []
    cdn_prefix = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket"

    for it in items:
        url = it.get('url')
        key = it.get('key')
        size = int(it.get('size') or 512)
        try:
            r = requests.get(url, timeout=20)
            r.raise_for_status()
            img = Image.open(io.BytesIO(r.content)).convert('RGB')
            img = img.resize((size, size), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, 'PNG', optimize=True)
            buf.seek(0)
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=key,
                Body=buf.getvalue(),
                ContentType='image/png',
                CacheControl='public, max-age=31536000, immutable',
            )
            results.append({'key': key, 'url': f'{cdn_prefix}/{key}', 'ok': True, 'size': size})
        except Exception as e:
            results.append({'key': key, 'ok': False, 'error': str(e)})

    return _resp({'ok': True, 'results': results})