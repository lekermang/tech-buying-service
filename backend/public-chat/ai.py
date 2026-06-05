"""
ИИ-ассистент Скупка24 на базе Polza.ai (ChatGPT).
Отвечает клиентам пока живой менеджер не подключился к диалогу.
"""
import os
import json
import re
import urllib.request

SMARTBERY_URL  = "https://smartbery-qrcode.ru/api/v1/products/"
PRICE_EMAIL_URL = "https://functions.poehali.dev/9e9486d9-57f0-454c-bc19-b46e3d4bc682"

# Ключевые слова для детекции запроса прайса
PRICE_KEYWORDS = [
    "прайс", "прайслист", "прайс-лист",
    "цены", "ценник", "прейскурант",
    "сколько стоит", "почём", "почем",
    "iphone", "айфон", "ipad",
    "samsung", "сяоми", "xiaomi",
]

def is_price_request(text: str) -> bool:
    """True если сообщение — запрос прайса/цен на новую технику."""
    t = text.lower()
    # Обязательно должно быть что-то из price keywords
    has_price_kw = any(kw in t for kw in PRICE_KEYWORDS)
    if not has_price_kw:
        return False
    # Уточняющие слова — новые, продажа, купить (не скупка)
    buy_kw = ["новый", "новые", "купить", "продаёт", "продает",
              "продажа", "каталог", "витрина", "прайс"]
    return any(kw in t for kw in buy_kw) or any(
        kw in t for kw in ["прайс", "прайслист", "ценник", "прейскурант"]
    )


def fetch_smartbery(only_available: bool = True, category_filter: str = "") -> list:
    """Получает товары из Smartbery API."""
    token = os.environ.get("SMARTBERY_TOKEN", "")
    req = urllib.request.Request(
        SMARTBERY_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
    except Exception:
        return []
    if only_available:
        data = [p for p in data if p.get("availability")]
    if category_filter:
        # фильтр по первому слову имени (iPhone = числа, или конкретный бренд)
        cf = category_filter.lower()
        filtered = []
        for p in data:
            name = (p.get("name") or "").lower()
            first = name.split()[0] if name.split() else ""
            if cf in ("iphone", "айфон"):
                if first.isdigit() or first in ("se2","se3","16e","17e","air","17","16","15","14","13","12","11"):
                    filtered.append(p)
            elif cf in ("samsung", "galaxy"):
                if "galaxy" in name or "samsung" in name or first in ("galaxy","samsung","s25","s26","s24","s23"):
                    filtered.append(p)
            elif cf in ("xiaomi", "redmi", "poco", "сяоми"):
                if first in ("redmi","poco","xiaomi"):
                    filtered.append(p)
            else:
                filtered.append(p)
        data = filtered or data  # если ничего не нашли — возвращаем всё
    return data


def price_hint(text: str, markup: int = 0) -> str:
    """
    Формирует блок с актуальными ценами Smartbery для подмешивания в промпт ИИ.
    Определяет категорию из текста запроса.
    """
    t = text.lower()

    # Определяем категорию
    if any(kw in t for kw in ["iphone", "айфон", "apple", "эппл"]):
        cat = "iphone"
    elif any(kw in t for kw in ["samsung", "самсунг", "galaxy"]):
        cat = "samsung"
    elif any(kw in t for kw in ["xiaomi", "redmi", "poco", "сяоми", "редми"]):
        cat = "xiaomi"
    else:
        cat = ""  # все товары

    products = fetch_smartbery(only_available=True, category_filter=cat)
    if not products:
        return ""

    # Ограничиваем — не больше 40 позиций в контексте ИИ
    products = products[:40]

    lines = ["АКТУАЛЬНЫЙ ПРАЙС СКУПКА24 (товары в наличии для продажи):"]
    for p in products:
        name = p.get("name") or ""
        price = p.get("price")
        region = p.get("country") or ""
        if price:
            final = int(price) + markup
            region_str = f" [{region}]" if region else ""
            lines.append(f"• {name}{region_str} — {final:,} ₽".replace(",", " "))
        else:
            lines.append(f"• {name} — цена уточняется")

    markup_note = f" (наценка +{markup:,} ₽)".replace(",", " ") if markup else ""
    lines.append(f"\nЦены актуальные, получены только что{markup_note}.")
    lines.append("Скажи клиенту: для заказа звоните +7 (992) 990-33-33 или пишите нам.")
    return "\n".join(lines)

AI_URL = 'https://api.polza.ai/v1/chat/completions'
AI_MODEL = 'gpt-4o-mini'

SYSTEM_PROMPT = """Ты — вежливый ассистент компании «Скупка24» (skypka24.com) из Калуги.
Компания: скупка и ремонт техники (телефоны, ноутбуки, технику Apple, фото, Dyson и др.),
а также продажа Б/У техники.

Контакты и факты:
- Телефон: +7 (992) 999-03-33
- Адрес: г. Калуга, ул. Кирова, 11
- Принимаем технику на скупку и ремонт, делаем быструю оценку.

КАК СЧИТАТЬ ЦЕНУ СКУПКИ (по приоритету):
1) ЕСЛИ ниже есть блок «РЕАЛЬНАЯ ИСТОРИЯ ЗАКУПОК СмартЛомбард» с похожей моделью —
   опирайся в первую очередь на эти реальные цены (за сколько мы реально брали такое).
   Назови цену скупки в диапазоне наших реальных закупок похожей модели.
2) ЕСЛИ похожих закупок нет — считай по формуле от рынка Avito.ru:
   - АЙФОНЫ (iPhone): цена скупки = рыночная цена б/у на Avito МИНУС 5000 ₽.
   - ОСТАЛЬНАЯ техника: цена скупки = 50% от рыночной цены на Avito.
- Назови ОРИЕНТИРОВОЧНУЮ сумму. Всегда добавляй, что точную назовёт менеджер после осмотра.

ЕСЛИ НИЖЕ ЕСТЬ БЛОК «АКТУАЛЬНЫЙ ПРАЙС СКУПКА24»:
- Используй эти данные чтобы назвать клиенту точные цены на наши товары.
- Отвечай списком: модель — цена.
- Скажи что товары в наличии и можно купить у нас.

Правила общения:
- Отвечай коротко, дружелюбно, по-русски, на «вы».
- Помогай по вопросам скупки, ремонта, продажи Б/У, режима работы, адреса.
- Если вопрос требует решения человека (конкретная сделка, спор, нестандартная ситуация) —
  скажи, что менеджер скоро подключится и ответит.
- Не выдумывай факты, которых не знаешь. Не обещай того, в чём не уверен.
- Отвечай 1–3 короткими предложениями, без длинных списков."""


def ask_deepseek(user_text: str, history: list | None = None, extra: str = '') -> str | None:
    """
    Возвращает ответ ИИ или None при ошибке/пустом ключе.
    history — список {'role': 'user'|'assistant', 'content': str} для контекста диалога.
    extra — доп. контекст (например, история закупок СмартЛомбард).
    """
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (user_text or '').strip():
        return None

    sys_prompt = SYSTEM_PROMPT + ('\n\n' + extra if extra else '')
    messages = [{'role': 'system', 'content': sys_prompt}]
    if history:
        messages.extend(history[-8:])
    messages.append({'role': 'user', 'content': user_text.strip()[:2000]})

    payload = json.dumps({
        'model': AI_MODEL,
        'messages': messages,
        'temperature': 0.4,
        'max_tokens': 300,
    }).encode('utf-8')

    req = urllib.request.Request(
        AI_URL,
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        answer = data['choices'][0]['message']['content'].strip()
        return answer or None
    except Exception as e:
        print(f'[ai][polza] error: {e}')
        return None


VISION_PROMPT = SYSTEM_PROMPT + """

Сейчас клиент прислал ФОТО техники. Твоя задача:
- Определи что на фото (тип устройства, модель/бренд если видно).
- Оцени видимое состояние (царапины, трещины, потёртости, комплект).
- Дай ОРИЕНТИРОВОЧНУЮ цену скупки, добавь что точную назовёт менеджер после осмотра.
- Если на фото не техника или непонятно — вежливо попроси прислать фото чётче."""


def ask_vision(image_url: str, user_text: str = '', extra: str = '') -> str | None:
    """Распознаёт фото техники и даёт ориентировочную оценку. image_url — публичный URL картинки."""
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (image_url or '').strip():
        return None
    sys_prompt = VISION_PROMPT + ('\n\n' + extra if extra else '')
    user_content = [
        {'type': 'text', 'text': (user_text or 'Что это за техника и сколько примерно стоит скупка?')[:1000]},
        {'type': 'image_url', 'image_url': {'url': image_url}},
    ]
    payload = json.dumps({
        'model': AI_MODEL,
        'messages': [
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': user_content},
        ],
        'temperature': 0.4,
        'max_tokens': 400,
    }).encode('utf-8')
    req = urllib.request.Request(
        AI_URL, data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        answer = data['choices'][0]['message']['content'].strip()
        return answer or None
    except Exception as e:
        print(f'[ai][vision] error: {e}')
        return None