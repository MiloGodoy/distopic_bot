require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Configuration, OpenAIApi } = require("openai");

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.VERCEL_URL + '/api/webhook');
} else {
  bot = new TelegramBot(token, { polling: true });
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Almacena mensajes
const chatMessages = {};

async function handleMessage(chatId, message, username) {
  console.log(`Recibido mensaje de ${username} en el chat ${chatId}: ${message}`);

  // Almacena mensajes para resumen
  if (!chatMessages[chatId]) chatMessages[chatId] = [];
  chatMessages[chatId].push(`${username}: ${message}`);

  // Comando de resumen
  if (message.toLowerCase() === '/resumen') {
    console.log(`Generando resumen para el chat ${chatId}`);
    const summary = await summarizeChat(chatMessages[chatId]);
    await bot.sendMessage(chatId, `Resumen del chat:\n${summary}`);
    return;
  }

  // Responder preguntas (ahora responde a cualquier mensaje que no sea un comando)
  if (!message.startsWith('/')) {
    console.log(`Generando respuesta para: ${message}`);
    const answer = await answerQuestion(message);
    await bot.sendMessage(chatId, answer);
    return;
  }

  // Moderación de palabras prohibidas
  const bannedWords = ['puto', 'puta', 'mierda'];
  if (bannedWords.some((word) => message.toLowerCase().includes(word))) {
    console.log(`Mensaje prohibido detectado en el chat ${chatId}: ${message}`);
    await bot.deleteMessage(chatId, message.message_id);
    await bot.sendMessage(chatId, `@${username}, tu mensaje fue eliminado por contener palabras prohibidas.`);
  }
}

async function summarizeChat(messages) {
  const conversation = messages.join('\n');
  console.log(`Resumiendo chat con ${messages.length} mensajes`);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {role: "system", content: "Eres un asistente útil que resume conversaciones de manera concisa."},
      {role: "user", content: `Resume esta conversación de manera concisa:\n${conversation}`}
    ],
    max_tokens: 150
  });
  return response.data.choices[0].message.content.trim();
}

async function answerQuestion(question) {
  console.log(`Consultando OpenAI con la pregunta: ${question}`);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {role: "system", content: "Eres un asistente útil y amigable que responde preguntas de manera clara y concisa."},
      {role: "user", content: question}
    ],
    max_tokens: 150
  });
  return response.data.choices[0].message.content.trim();
}

if (process.env.NODE_ENV !== 'production') {
  bot.on('message', (msg) => {
    handleMessage(msg.chat.id, msg.text, msg.from.username);
  });
  console.log('Bot is running in development mode...');
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { body } = req;
    if (body.message) {
      const chatId = body.message.chat.id;
      const message = body.message.text;
      const username = body.message.from.username;
      await handleMessage(chatId, message, username);
    }
  }
  res.status(200).send('OK');
};

console.log('Bot is running...');

