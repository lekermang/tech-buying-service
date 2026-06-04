"""
ИИ-помощник команды Скупка24 для чата СКУПКА24Vip (Polza.ai / ChatGPT).
Два режима:
  1. Ответ сотруднику на вопрос/упоминание.
  2. Часовой советник: что сделать сейчас, чтобы не упустить прибыль.
"""
import os
import json
import urllib.request
import urllib.error

AI_URL = 'https://api.polza.ai/v1/chat/completions'
AI_MODEL = 'gpt-4o-mini'

ASSISTANT_PROMPT = """Ты — ИИ-помощник команды «Скупка24» (Калуга): скупка, ремонт и продажа техники.
Помогаешь СОТРУДНИКАМ прямо в их рабочем чате.
- Отвечай коротко, по делу, по-русски, по-деловому и дружелюбно.
- Помогай с оценкой техники, формулировками для клиентов, приоритетами, идеями допродаж.
- Если не хватает данных — задай уточняющий вопрос.
- Без воды, 1–4 предложения. Можно списком, если это уместно.

ЦЕНА СКУПКИ (по приоритету):
1) ЕСЛИ ниже есть блок «РЕАЛЬНАЯ ИСТОРИЯ ЗАКУПОК СмартЛомбард» с похожей моделью —
   опирайся на эти реальные цены (за сколько мы реально брали такое).
2) ИНАЧЕ по формуле от рынка Avito.ru:
   - АЙФОНЫ (iPhone): скупка = рыночная цена б/у на Avito МИНУС 5000 ₽.
   - ОСТАЛЬНАЯ техника: скупка = 50% от рыночной цены на Avito."""

ADVISOR_PROMPT = """Ты — ИИ-советник по прибыли для команды «Скупка24» (Калуга).
Тебе дают сводку: горящие заявки, висящие ремонты, неотвеченные чаты клиентов.
Дай сотрудникам КОНКРЕТНЫЙ список действий прямо сейчас, чтобы не упустить деньги.
Правила:
- Начни с самого срочного (деньги, которые можно потерять прямо сейчас).
- Пиши коротко, по пунктам с эмодзи, максимум 5 пунктов.
- Каждый пункт — конкретное действие («перезвони по заявке #...», «закрой ремонт #...»).
- Если всё спокойно — короткая мотивирующая фраза и 1–2 идеи для допродаж.
- По-русски, по-деловому, без воды. Не выдумывай номера, которых нет в сводке."""


def _call(messages: list, max_tokens: int = 350) -> str | None:
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key:
        return None
    payload = json.dumps({
        'model': AI_MODEL,
        'messages': messages,
        'temperature': 0.5,
        'max_tokens': max_tokens,
    }).encode('utf-8')
    req = urllib.request.Request(
        AI_URL, data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return (data['choices'][0]['message']['content'] or '').strip() or None
    except Exception as e:
        print(f'[vip-ai] error: {e}')
        return None


def answer_staff(question: str, history: list | None = None, extra: str = '') -> str | None:
    """Ответ сотруднику на вопрос в чате."""
    if not (question or '').strip():
        return None
    sys_prompt = ASSISTANT_PROMPT + ('\n\n' + extra if extra else '')
    messages = [{'role': 'system', 'content': sys_prompt}]
    if history:
        messages.extend(history[-8:])
    messages.append({'role': 'user', 'content': question.strip()[:2000]})
    return _call(messages, max_tokens=350)


def advise(summary: str) -> str | None:
    """Часовой совет по прибыли на основе текстовой сводки."""
    messages = [
        {'role': 'system', 'content': ADVISOR_PROMPT},
        {'role': 'user', 'content': summary.strip()[:3000]},
    ]
    return _call(messages, max_tokens=450)


VISION_PROMPT = """Ты — ИИ-помощник команды «Скупка24» (Калуга): скупка, ремонт и продажа техники.
Сотрудник прислал ФОТО техники. Помоги ему:
- Определи устройство (тип, модель/бренд если видно).
- Оцени видимое состояние (царапины, трещины, потёртости, комплект).
- Посчитай ОРИЕНТИРОВОЧНУЮ цену скупки по приоритету:
  1) ЕСЛИ ниже есть блок «РЕАЛЬНАЯ ИСТОРИЯ ЗАКУПОК СмартЛомбард» с похожей моделью — опирайся на эти реальные цены.
  2) ИНАЧЕ по формуле от рынка Avito.ru:
     • АЙФОНЫ (iPhone): скупка = рыночная цена б/у на Avito МИНУС 5000 ₽.
     • ОСТАЛЬНАЯ техника: скупка = 50% от рыночной цены на Avito.
- Подскажи, на что обратить внимание при оценке.
- Отвечай коротко, по-деловому, по-русски."""


def vision_staff(image_url: str, question: str = '', extra: str = '') -> str | None:
    """Распознаёт фото техники для сотрудника. image_url — публичный URL."""
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (image_url or '').strip():
        return None
    sys_prompt = VISION_PROMPT + ('\n\n' + extra if extra else '')
    user_content = [
        {'type': 'text', 'text': (question or 'Что за техника на фото, состояние и ориентировочная цена?')[:1000]},
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
        return (data['choices'][0]['message']['content'] or '').strip() or None
    except Exception as e:
        print(f'[vip-ai][vision] error: {e}')
        return None