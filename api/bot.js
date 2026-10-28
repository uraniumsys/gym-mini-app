const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MINI_APP_URL = 'https://gym-mini-app-six.vercel.app';

export default async function handler(req, res) {
  // 🛠️ СПЕЦИАЛЬНАЯ ПРОВЕРКА: откроем эту ссылку в браузере, чтобы проверить токен
  if (req.method === 'GET' && req.query.test === 'token') {
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: '❌ Переменная BOT_TOKEN не найдена в Vercel!' });
    }
    
    const testResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const testData = await testResponse.json();
    
    return res.status(200).json({ 
      message: '✅ Токен найден! Проверка связи с Telegram:',
      tokenLength: BOT_TOKEN.length,
      telegramResponse: testData 
    });
  }

  // Обычная логика бота
  if (req.method !== 'POST') {
    return res.status(200).send('Бот работает. Ожидает команду /start');
  }

  const update = req.body;
  console.log("📥 Получен update:", JSON.stringify(update));

  if (update.message && update.message.text && update.message.text.startsWith('/start')) {
    const chatId = update.message.chat.id;
    const userName = update.message.from.first_name || 'друг';

    console.log("📤 Отправляем сообщение в чат:", chatId);

    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `👋 Привет, <b>${userName}</b>!\n\nДобро пожаловать в Gym Mini App 💪`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🚀 Открыть приложение', web_app: { url: MINI_APP_URL } }]]
        }
      })
    });

    const responseData = await response.json();
    console.log("📡 Ответ от Telegram API:", responseData);
  }

  return res.status(200).json({ ok: true });
}
