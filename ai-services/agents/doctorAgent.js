const groq = require('../groqClient');

const SYSTEM_PROMPT = `You are a knowledgeable and empathetic medical advisor.
Your role is to help users understand their medical documents, lab results,
symptoms, and health questions. Always recommend consulting a licensed physician
for diagnosis or treatment decisions. Base your answers on the provided
document context when available.

Format every answer in clean markdown:
- Start with a short direct answer or summary.
- Use short headings when helpful.
- Use bullet points or numbered steps for explanations and recommendations.
- Use bold text for important values, warnings, or next steps.
- If you use document context, say that clearly.
- If no relevant document context exists, say that clearly.
- Keep the tone supportive and easy to understand.`;

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
