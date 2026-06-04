"""
ИИ-ассистент Скупка24 на базе Polza.ai (ChatGPT).
Отвечает клиентам в MAX, пока живой менеджер не подключился к диалогу.
"""
import os
import json
import urllib.request

AI_URL = 'https://api.polza.ai/v1/chat/completions'
AI_MODEL = 'gpt-4o-mini'

SYSTEM_PROMPT = """Ты — дружелюбный умный ассистент в мессенджере MAX от компании «Скупка24» (Калуга).
Ты помогаешь людям и отвечаешь на ЛЮБЫЕ вопросы — не только про компанию.
Можешь общаться на любые темы: бытовые вопросы, советы, объяснения, расчёты,
переводы, идеи, помощь с текстами и т.д. — как обычный ИИ-помощник.

Когда спрашивают про компанию, держи под рукой факты:
- «Скупка24»: скупка, ремонт и продажа техники (телефоны, ноутбуки, Apple, фото, Dyson и др.).
- Телефон: +7 (992) 999-03-33
- Адрес: г. Калуга, ул. Кирова, 11
- По скупке/ремонту можешь называть ОРИЕНТИРОВОЧНЫЕ цены, но добавляй, что точную сумму
  назовёт менеджер после осмотра. По конкретной сделке — скажи, что подключится менеджер.

Стиль:
- Отвечай по-русски, дружелюбно, на «вы», по делу.
- На простые вопросы — коротко (1–4 предложения). На сложные можно подробнее, списком.
- Не выдумывай факты, которых не знаешь. Будь честным и полезным."""


def ask_deepseek(user_text: str, history: list | None = None) -> str | None:
    """
    Возвращает ответ ИИ или None при ошибке/пустом ключе.
    history — список {'role': 'user'|'assistant', 'content': str} для контекста диалога.
    """
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (user_text or '').strip():
        return None

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
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


VISION_PROMPT = """Ты — ассистент компании «Скупка24» (Калуга): скупка, ремонт и продажа техники.
Клиент прислал ФОТО. Твоя задача:
- Определи что на фото (тип устройства, модель/бренд если видно).
- Оцени видимое состояние (царапины, трещины, потёртости, комплект).
- Если это техника — дай ОРИЕНТИРОВОЧНУЮ цену скупки и добавь, что точную назовёт менеджер после осмотра.
- Если на фото не техника — просто дружелюбно опиши, что видишь.
- Отвечай по-русски, на «вы», коротко и по делу."""


def ask_vision(image_url: str, user_text: str = '') -> str | None:
    """Распознаёт фото и даёт оценку техники. image_url — публичный URL картинки."""
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (image_url or '').strip():
        return None
    user_content = [
        {'type': 'text', 'text': (user_text or 'Что на фото? Если техника — сколько примерно стоит скупка?')[:1000]},
        {'type': 'image_url', 'image_url': {'url': image_url}},
    ]
    payload = json.dumps({
        'model': AI_MODEL,
        'messages': [
            {'role': 'system', 'content': VISION_PROMPT},
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