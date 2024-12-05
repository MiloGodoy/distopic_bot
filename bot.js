require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Función para responder preguntas
bot.onText(/\/pregunta (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, `Tu pregunta fue: ${resp}`);
  // Aquí puedes implementar la lógica para responder preguntas
});

// Función para hacer resúmenes de conversaciones
bot.onText(/\/resumen/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Aquí va un resumen de la conversación...');
  // Aquí puedes implementar la lógica para resumir conversaciones
});

// Función para verificar el precio máximo de Bitcoin
async function checkBitcoinPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const price = response.data.bitcoin.usd;
    // Aquí deberías implementar la lógica para verificar si es un máximo histórico
    // Por ahora, solo enviamos el precio actual
    bot.sendMessage(msg.chat.id, `El precio actual de Bitcoin es: $${price}`);
  } catch (error) {
    console.error('Error al obtener el precio de Bitcoin:', error);
  }
}

// Verificar el precio de Bitcoin cada hora
setInterval(checkBitcoinPrice, 3600000);

console.log('Bot is running...');

