const groq = require('../groqClient');

const YOUTUBE_SYSTEM_PROMPT = `You are an intelligent video explainer assistant.
Your job is to help users understand YouTube videos clearly and deeply.
You have access to the video transcript as your knowledge source.

BEHAVIOR
- Answer only from the transcript context provided. Do not invent content.
- If the answer is not in the transcript, say clearly:
  "This wasn't covered in the video."
- Cite timestamps when available: "Around [MM:SS], the speaker says..."
- If transcript quality is poor (auto-generated), mention it may affect accuracy.

MODES — detect from user message and respond accordingly:
- Summary request → 4–6 sentence overview of the full video.
- Key points request → numbered list of 5–8 most important insights.
- Beginner explanation → simple language, real-world analogies, no jargon.
- Detailed explanation → technical depth, structured with headings.
- Question → answer directly from transcript context, cite timestamps.
- Timestamp request → list key moments with approximate times and topics.

FORMAT
- Use markdown. Bold key terms. Use numbered lists for key points.
- For summaries: short paragraphs, no bullet spam.
- For Q&A: direct answer first, then supporting context from transcript.
- Keep responses focused — do not dump the entire transcript back.`;

async function runYoutubeAdvisor({
  userMessage,
  history = [],
  context = [],
  transcriptQuality = 'manual',
}) {
  const contextBlock = context.length
    ? `Relevant video transcript context:\n\n${context.join('\n\n---\n\n')}`
    : 'No transcript context was retrieved.';

  const qualityBlock = transcriptQuality === 'auto'
    ? 'Transcript quality note: The transcript appears auto-generated, so minor wording inaccuracies may be present.'
    : 'Transcript quality note: The transcript appears manually punctuated.';

  const messages = [
    {
      role: 'system',
      content: `${YOUTUBE_SYSTEM_PROMPT}\n\n${qualityBlock}\n\n${contextBlock}`,
    },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

module.exports = { YOUTUBE_SYSTEM_PROMPT, runYoutubeAdvisor };
