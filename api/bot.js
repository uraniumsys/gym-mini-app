const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MINI_APP_URL = 'https://gym-mini-app-six.vercel.app';

// 🔥 ВОТ ТВОЙ НАЙДЕННЫЙ ID КАСТОМНОГО ЭМОДЗИ
const CUSTOM_EMOJI_ID = '5870734657384877785';

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.test === 'token') {
    if (!BOT_TOKEN) return res.status(500).json({ error: '❌ BOT_TOKEN не найден' });
    const testResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    return res.status(200).json({ message: '✅ Токен работает!', telegramResponse: await testResponse.json() });
  }

  if (req.method !== 'POST') {
    return res.status(200).send('🤖 Бот работает. Напиши /start в Telegram');
  }

  let update = req.body;
  if (typeof update === 'string') {
    try { update = JSON.parse(update); } 
    catch (e) { return res.status(400).send("Invalid JSON"); }
  }

  if (update && update.message && update.message.text && update.message.text.startsWith('/start')) {
    const chatId = update.message.chat.id;
    const userName = update.message.from.first_name || 'друг';

    // Обрати внимание: текст начинается с символа "✨" (его длина ровно 2 символа в коде)
    // Telegram заменит его на твой кастомный эмодзи благодаря массиву entities ниже
    const welcomeText = `✨ Привет, <b>${userName}</b>!

Добро пожаловать в <b>gym***</b> — твой инструмент для построения тела мечты.

<blockquote>
🗡️ <b>Что внутри:</b>

🖇️ <b>Программы тренировок</b>
Выбирай готовые программы или составляй свои.

🖇️ <b>Трекер прогресса</b>
Записывай результаты, отслеживай динамику и достигай целей быстрее.

🖇️ <b>Огромное количество упражнений</b>
Вместе с пояснениями к технике выполнения.

🖇️ <b>Кольца активности</b>
Чтобы ты сохранял мотивацию и не пропускал ни одной тренировки.
</blockquote>

⚔️ <b>Начать очень просто:</b>
Нажми кнопку ниже — приложение откроется прямо внутри Telegram.

<blockquote><i>Если возникнут вопросы или предложения по рекламе — пиши нам!</i></blockquote>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🌙 Открыть приложение', web_app: { url: MINI_APP_URL } }],
        [
          { text: '🌐 О боте', callback_data: 'about' },
          { text: '📞 Контакты', url: 'https://t.me/ijustwanttto' }
        ]
      ]
    };

    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeText.trim(),
        parse_mode: 'HTML',
        reply_markup: keyboard,
        // 👇 МАГИЯ: говорим Telegram заменить первые 2 символа (✨) на наш кастомный эмодзи
        entities: [
          {
            type: 'custom_emoji',
            offset: 0,                     // Начинается с самого первого символа
            length: 2,                     // Длина эмодзи-заглушки "✨" в UTF-16 всегда 2
            custom_emoji_id: 5870734657384877785 // Твой найденный ID
          }
        ]
      })
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error("❌ Ошибка отправки:", responseData);
    }

    return res.status(200).json({ ok: true });
  }

  // Обработка нажатий на inline-кнопки
  if (update.callback_query && update.callback_query.data) {
    const callbackData = update.callback_query.data;
    const callbackChatId = update.callback_query.message.chat.id;
    const callbackQueryId = update.callback_query.id;

    await fetch(`${API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId })
    });

    if (callbackData === 'about') {
      await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: callbackChatId,
          text: 'ℹ️ <b>Gym Mini App</b> — это удобное приложение для тренировок прямо внутри Telegram.\n\nРазработано с любовью к спорту 💪',
          parse_mode: 'HTML'
        })
      });
    }
  }

  return res.status(200).json({ ok: true });
}
