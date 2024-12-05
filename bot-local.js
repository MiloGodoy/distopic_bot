require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Almacena mensajes
const chatMessages = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const message = msg.text;

    console.log('Recibido mensaje:', msg); // Log de mensaje recibido

    // Almacena mensajes para resumen
    if (!chatMessages[chatId]) chatMessages[chatId] = [];
    chatMessages[chatId].push(message);
    console.log(`Mensaje almacenado para el chat ${chatId}: ${message}`); // Log del mensaje almacenado

    // Comando de resumen
    if (message === '/resumen') {
        console.log(`Generando resumen para el chat ${chatId}`); // Log de comando de resumen
        const summary = await summarizeChat(chatMessages[chatId]);
        await bot.sendMessage(chatId, `Resumen del chat:\n${summary}`);
    }

    // Responder preguntas
    if (message.startsWith('?')) {
        const question = message.slice(1);
        console.log(`Generando respuesta para la pregunta: ${question}`); // Log de pregunta recibida
        const answer = await answerQuestion(question);
        await bot.sendMessage(chatId, answer);
    }

    // Moderación de palabras prohibidas
    const bannedWords = ['palabra1', 'palabra2'];
    if (bannedWords.some((word) => message.includes(word))) {
        console.log(`Mensaje prohibido detectado en el chat ${chatId}: ${message}`); // Log de mensaje prohibido
        await bot.deleteMessage(chatId, msg.message_id);
        await bot.sendMessage(chatId, `Mensaje eliminado por contener palabras prohibidas.`);
    }
});

// Funciones auxiliares
async function summarizeChat(messages) {
    const conversation = messages.join('\n');
    console.log(`Resumiendo chat con ${messages.length} mensajes`); // Log de cantidad de mensajes
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Resume este chat:\n${conversation}`,
        max_tokens: 100,
    });
    return response.data.choices[0].text.trim();
}

async function answerQuestion(question) {
    console.log(`Consultando OpenAI con la pregunta: ${question}`); // Log de pregunta consultada
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Responde esta pregunta:\n${question}`,
        max_tokens: 150,
    });
    return response.data.choices[0].text.trim();
}

console.log('Bot is running...');

