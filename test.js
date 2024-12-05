require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function testAnswerQuestion() {
  const question = "¿Cuál es la capital de Francia?";
  console.log(`Probando pregunta: ${question}`);
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `Responde esta pregunta:\n${question}`,
    max_tokens: 150,
  });
  console.log("Respuesta:", response.data.choices[0].text.trim());
}

testAnswerQuestion();

