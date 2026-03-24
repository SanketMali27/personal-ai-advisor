const groq = require('../groqClient');

require('dotenv').config();
load_env();
const GROQ_API_KEY = process.env.GROQ_API_KEY;


const SYSTEM_PROMPT = `You are a knowledgeable and empathetic medical advisor.
Your role is to help users understand their medical documents, lab results,
symptoms, and health questions. Always recommend consulting a licensed physician
for diagnosis or treatment decisions. Base your answers on the provided
document context when available.`;

async function runDoctorAgent({ userMessage, history, context }) {
  const contextBlock = context.length
    ? `Relevant medical documents:\n\n${context.join('\n\n---\n\n')}`
    : 'No relevant documents found. Answering from general medical knowledge.';

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.2,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
}

module.exports = { runDoctorAgent };
