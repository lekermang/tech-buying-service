"""
Создание платежа ЮKassa для формы доната/оплаты с сайта Скупка24.
POST / — создать платёж, вернуть confirmation_url
GET /?payment_id=xxx — проверить статус платежа
"""
import json
import os
import uuid
import urllib.request
import base64


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    # GET — проверка статуса
    if method == "GET" and params.get("payment_id"):
        payment_id = params["payment_id"]
        req = urllib.request.Request(
            f"https://api.yookassa.ru/v3/payments/{payment_id}",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"status": data.get("status"), "paid": data.get("paid", False)}),
        }

    # POST — создать платёж
    body = json.loads(event.get("body") or "{}")
    amount = body.get("amount", 100)
    name = body.get("name", "Клиент")
    phone = body.get("phone", "")
    description = body.get("description", "Оплата услуг Скупка24")
    return_url = body.get("return_url", "https://skypka24.poehali.dev/payment-success")

    amount = max(100, int(amount))

    idempotence_key = str(uuid.uuid4())
    payload = {
        "amount": {"value": f"{amount}.00", "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": return_url},
        "capture": True,
        "description": f"{description} | {name} {phone}".strip(" |"),
        "metadata": {"name": name, "phone": phone},
    }

    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        "https://api.yookassa.ru/v3/payments",
        data=data,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
            "Idempotence-Key": idempotence_key,
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    confirmation_url = result.get("confirmation", {}).get("confirmation_url", "")
    payment_id = result.get("id", "")

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({
            "payment_id": payment_id,
            "confirmation_url": confirmation_url,
            "status": result.get("status"),
        }),
    }
