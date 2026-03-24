const groq = require('../groqClient');

require('dotenv').config();
load_env();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SYSTEM_PROMPT = `You are a knowledgeable legal assistant.
Help users understand legal documents, contracts, rights, and general
legal concepts. Always clarify that you are not a licensed attorney and
that users should consult a qualified lawyer for legal advice.
Use the provided legal documents as your primary reference.`;

async function runLawyerAgent({ userMessage, history, context }) {
  const contextBlock = context.length
    ? `Relevant legal documents:\n\n${context.join('\n\n---\n\n')}`
    : 'No documents found. Answering from general legal knowledge.';

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

module.exports = { runLawyerAgent };
