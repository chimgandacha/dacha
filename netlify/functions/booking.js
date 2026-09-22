const TELEGRAM_API = 'https://api.telegram.org';

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Only POST is allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    return jsonResponse(503, {
      ok: false,
      error: 'Telegram credentials are not configured'
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON' });
  }

  const fields = ['name', 'phone', 'checkin', 'checkout', 'guests', 'message', 'wishes'];
  const values = Object.fromEntries(
    fields.map((field) => [field, String(payload[field] ?? '').trim()])
  );
  const requiredFields = ['name', 'phone', 'checkin', 'checkout', 'guests'];
  const missing = requiredFields.filter((field) => !values[field]);

  if (missing.length > 0) {
    return jsonResponse(400, {
      ok: false,
      error: `Missing required fields: ${missing.join(', ')}`
    });
  }

  const text = [
    '<b>Новая заявка на бронирование</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(values.name)}`,
    `<b>Телефон:</b> ${escapeHtml(values.phone)}`,
    `<b>Дата заезда:</b> ${escapeHtml(values.checkin)}`,
    `<b>Дата выезда:</b> ${escapeHtml(values.checkout)}`,
    `<b>Количество гостей:</b> ${escapeHtml(values.guests)}`,
    `<b>Комментарий:</b> ${escapeHtml(values.message || '—')}`,
    `<b>Дополнительные пожелания:</b> ${escapeHtml(values.wishes || '—')}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(
      `${TELEGRAM_API}/bot${encodeURIComponent(botToken)}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
      }
    );
    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error('Telegram API error:', telegramResult);
      return jsonResponse(502, { ok: false, error: 'Telegram API request failed' });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('Telegram request failed:', error);
    return jsonResponse(502, { ok: false, error: 'Unable to reach Telegram API' });
  }
};
