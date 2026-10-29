const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MINI_APP_URL = 'https://gym-mini-app-six.vercel.app';

export default async function handler(req, res) {
  // 🛠️ Диагностика токена: открой в браузере /api/bot?test=token
  if (req.method === 'GET' && req.query.test === 'token') {
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: '❌ BOT_TOKEN не найден' });
    }
    const testResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const testData = await testResponse.json();
    return res.status(200).json({ 
      message: '✅ Токен работает!',
      tokenLength: BOT_TOKEN.length,
      telegramResponse: testData 
    });
  }

  // 🛠️ Диагностика запросов: открой в браузере /api/bot?debug=true
  if (req.method === 'GET' && req.query.debug === 'true') {
    return res.status(200).json({
      method: req.method,
      bodyType: typeof req.body,
      body: req.body,
      headers: req.headers
    });
  }

  // Основная логика бота
  if (req.method !== 'POST') {
    return res.status(200).send(' Бот работает. Напиши /start в Telegram');
  }

  let update = req.body;
  if (typeof update === 'string') {
    try { update = JSON.parse(update); } 
    catch (e) { return res.status(400).send("Invalid JSON"); }
  }

  console.log("📥 Получен update:", JSON.stringify(update));

  if (update && update.message && update.message.text && update.message.text.startsWith('/start')) {
    const chatId = update.message.chat.id;
    const userName = update.message.from.first_name || 'друг';

    // ============================================
    // 📝 ЗДЕСЬ МЕНЯЕТСЯ ТЕКСТ ПРИВЕТСТВИЯ
    // ============================================
    const welcomeText = `
 Привет, <b>${userName}</b>!

Добро пожаловать в <b>gym***</b>
Твой инструмент для построения тела мечты.

🗡️ <b>Что внутри:</b>

🖇️ <b>Программы тренировок</b>
Готовые планы для любого уровня подготовки — от новичка до продвинутого.

🖇️ <b>Трекер прогресса</b>
Записывай результаты, отслеживай динамику и достигай целей быстрее.

🖇️ <b>Советы по питанию</b>
Рекомендации по рациону, которые помогут получить максимум от тренировок.

🖇️ <b>Таймеры и напоминания</b>
Не пропусти ни одну тренировку.

⚔️ <b>Начать очень просто:</b>
Нажми кнопку ниже — и приложение откроется прямо внутри Telegram.

<i>Если возникнут вопросы — напиши нам, мы всегда на связи!</i>
    `;
    // ============================================

    // Кнопки под сообщением
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌙 Открыть приложение', web_app: { url: MINI_APP_URL } }
        ],
        [
          { text: '🌐 О боте', callback_data: 'about' },
          { text: '📞 Поддержка/реклама', url: 'https://t.me/ijustwanttto' }
        ]
      ]
    };

    console.log("📤 Отправляем приветствие в чат:", chatId);

    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeText.trim(),
        parse_mode: 'HTML',
        reply_markup: keyboard
      })
    });

    const responseData = await response.json();
    console.log("📡 Ответ Telegram API:", JSON.stringify(responseData));

    if (!response.ok) {
      console.error("❌ Ошибка отправки:", responseData);
    }

    return res.status(200).json({ ok: true, telegramResponse: responseData });
  }

  // Обработка нажатий на inline-кнопки (callback)
  if (update.callback_query && update.callback_query.data) {
    const callbackData = update.callback_query.data;
    const callbackChatId = update.callback_query.message.chat.id;
    const callbackQueryId = update.callback_query.id;

    // Убираем "крутилку" на кнопке
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
