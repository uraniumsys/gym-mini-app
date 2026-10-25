import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { initData } = req.body;
  if (!initData) {
    return res.status(400).json({ error: 'Missing initData' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      console.error('Invalid initData signature');
      return res.status(403).json({ error: 'Invalid initData signature' });
    }

    const userStr = urlParams.get('user');
    if (!userStr) {
      return res.status(400).json({ error: 'Missing user data in initData' });
    }
    
    const user = JSON.parse(userStr);
    const userId = user.id;

    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(CHANNEL_ID)}&user_id=${userId}`;
    const tgResponse = await fetch(tgUrl);
    const tgData = await tgResponse.json();

    if (!tgData.ok) {
      console.error('Telegram API Error:', tgData);
      return res.status(500).json({ error: 'Telegram API error' });
    }

    const status = tgData.result.status;
    const isSubscribed = ['creator', 'administrator', 'member'].includes(status);

    return res.status(200).json({ isSubscribed });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
