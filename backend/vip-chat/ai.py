"""
ИИ-помощник команды Скупка24 для чата СКУПКА24Vip (DeepSeek).
Два режима:
  1. Ответ сотруднику на вопрос/упоминание.
  2. Часовой советник: что сделать сейчас, чтобы не упустить прибыль.
"""
import os
import json
import urllib.request

DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

ASSISTANT_PROMPT = """Ты — ИИ-помощник команды «Скупка24» (Калуга): скупка, ремонт и продажа техники.
Помогаешь СОТРУДНИКАМ прямо в их рабочем чате.
- Отвечай коротко, по делу, по-русски, по-деловому и дружелюбно.
- Помогай с оценкой техники, формулировками для клиентов, приоритетами, идеями допродаж.
- Если не хватает данных — задай уточняющий вопрос.
- Без воды, 1–4 предложения. Можно списком, если это уместно."""

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
    api_key = os.environ.get('DEEPSEEK_API_KEY', '').strip()
    if not api_key:
        return None
    payload = json.dumps({
        'model': 'deepseek-chat',
        'messages': messages,
        'temperature': 0.5,
        'max_tokens': max_tokens,
    }).encode('utf-8')
    req = urllib.request.Request(
        DEEPSEEK_URL, data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return (data['choices'][0]['message']['content'] or '').strip() or None
    except Exception as e:
        print(f'[vip-ai] error: {e}')
        return None


def answer_staff(question: str, history: list | None = None) -> str | None:
    """Ответ сотруднику на вопрос в чате."""
    if not (question or '').strip():
        return None
    messages = [{'role': 'system', 'content': ASSISTANT_PROMPT}]
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
