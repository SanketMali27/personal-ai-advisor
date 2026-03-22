const groq = require('../groqClient');

const SYSTEM_PROMPT = `You are a professional financial advisor assistant.
Help users understand their financial documents, budgets, investment portfolios,
tax records, and financial planning questions. Always clarify you are not a
certified financial planner and recommend professional advice for major decisions.
Use the provided financial documents as your primary reference.`;

async function runFinanceAgent({ userMessage, history, context }) {
  const contextBlock = context.length
    ? `Relevant financial documents:\n\n${context.join('\n\n---\n\n')}`
    : 'No documents found. Answering from general financial knowledge.';

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

module.exports = { runFinanceAgent };
