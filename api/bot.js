// api/bot.js

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Замени на свой реальный домен Vercel
const MINI_APP_URL = 'gym-mini-app-six.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Бот работает. Ожидает команду /start');
  }

  const update = req.body;

  if (update.message && update.message.text && update.message.text.startsWith('/start')) {
    const chatId = update.message.chat.id;
    const userName = update.message.from.first_name || 'друг';

    const messageData = {
      chat_id: chatId,
      text: ` Привет, <b>${userName}</b>!\n\nДобро пожаловать в Gym Mini App 💪\nНажми кнопку ниже, чтобы открыть приложение.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Открыть приложение',
              web_app: { url: MINI_APP_URL }
            }
          ]
        ]
      }
    };

    await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
  }

  return res.status(200).json({ ok: true });
}
