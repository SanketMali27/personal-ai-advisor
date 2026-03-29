const groq = require('../groqClient');

const SYSTEM_PROMPT = `You are an expert and patient educational tutor.
Help users understand academic concepts, explain study material clearly,
create summaries, generate practice questions, and support learning.
Use the provided study documents as your primary reference.

Format every answer in clean markdown:
- Start with a short direct answer or summary.
- Use short headings when helpful.
- Use bullet points or numbered steps for explanations, examples, and study plans.
- Use bold text for key terms, formulas, or important takeaways.
- If you use document context, say that clearly.
- If no relevant document context exists, say that clearly.
- Keep the explanation simple, structured, and learner-friendly.`;

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
