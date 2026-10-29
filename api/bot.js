const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MINI_APP_URL = 'https://gym-mini-app-six.vercel.app';

export default async function handler(req, res) {
  // 1. Отладка: если открыть ссылку с ?debug=true, покажем, что видит Vercel
  if (req.method === 'GET' && req.query.debug === 'true') {
    return res.status(200).json({
      method: req.method,
      bodyType: typeof req.body,
      body: req.body,
      headers: req.headers
    });
  }

  if (req.method !== 'POST') {
    return res.status(200).send('Бот работает. Ожидает команду /start');
  }

  // 2. Защита: иногда Vercel передает body как строку, а не как объект
  let update = req.body;
  if (typeof update === 'string') {
    try {
      update = JSON.parse(update);
    } catch (e) {
      console.error("❌ Ошибка парсинга JSON:", e);
      return res.status(400).send("Invalid JSON");
    }
  }

  console.log("📥 ПОЛУЧЕН UPDATE:", JSON.stringify(update));

  // 3. Проверяем, есть ли вообще текст сообщения
  if (update && update.message && update.message.text) {
    console.log("📝 Текст сообщения:", update.message.text);
    
    if (update.message.text.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const userName = update.message.from.first_name || 'друг';

      console.log("📤 ОТПРАВЛЯЕМ СООБЩЕНИЕ в чат:", chatId);

      const response = await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `👋 Привет, <b>${userName}</b>!\n\nДобро пожаловать в gym***`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '🚀 Открыть приложение', web_app: { url: MINI_APP_URL } }]]
          }
        })
      });

      const responseData = await response.json();
      console.log("📡 ОТВЕТ TELEGRAM API:", JSON.stringify(responseData));
      
      return res.status(200).json({ ok: true, telegramResponse: responseData });
    }
  } else {
    console.log("⚠️ Получен запрос, но это НЕ текстовое сообщение (или нет поля message.text)");
  }

  return res.status(200).json({ ok: true });
}
