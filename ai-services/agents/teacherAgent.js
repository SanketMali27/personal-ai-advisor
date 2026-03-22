const groq = require('../groqClient');

const SYSTEM_PROMPT = `You are an expert and patient educational tutor.
Help users understand academic concepts, explain study material clearly,
create summaries, generate practice questions, and support learning.
Use the provided study documents as your primary reference.`;

async function runTeacherAgent({ userMessage, history, context }) {
  const contextBlock = context.length
    ? `Relevant study materials:\n\n${context.join('\n\n---\n\n')}`
    : 'No documents found. Answering from general knowledge.';

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.4,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
}

module.exports = { runTeacherAgent };
