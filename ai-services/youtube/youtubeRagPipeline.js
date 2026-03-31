const { randomUUID } = require('crypto');
const groq = require('../groqClient');
const { runYoutubeAdvisor } = require('../agents/youtubeAdvisor');
const { chunkText } = require('../rag/indexer');
const { retrieveCollectionContext } = require('../rag/retriever');
const {
  collectionExists,
  ensureCollectionByName,
  upsertVectorsToCollection,
} = require('../../vector-db/qdrantClient');
const { generateEmbedding } = require('../embeddings/embedder');

function getYoutubeCollectionName(videoId) {
  return `youtube__${videoId}`;
}

function ensureLeadingTimestamp(chunk) {
  const normalizedChunk = String(chunk || '').trim();

  if (!normalizedChunk) {
    return '';
  }

  const leadingTimestampMatch = normalizedChunk.match(/^\[(\d{2}:\d{2})\]/);

  if (leadingTimestampMatch) {
    return normalizedChunk;
  }

  const timestampMatch = normalizedChunk.match(/\[(\d{2}:\d{2})\]/);

  if (!timestampMatch) {
    return normalizedChunk;
  }

  return `[${timestampMatch[1]}] ${normalizedChunk.replace(/\[(\d{2}:\d{2})\]\s*/, '')}`.trim();
}

function buildChunkPayloads(videoId, transcriptText, domain) {
  const baseChunks = chunkText(transcriptText, 400, 50)
    .map((chunk) => ensureLeadingTimestamp(chunk))
    .filter(Boolean);

  return baseChunks.map((chunk, index) => {
    const timestampMatch = chunk.match(/^\[(\d{2}:\d{2})\]/);

    return {
      text: chunk,
      timestamp: timestampMatch ? timestampMatch[1] : null,
      chunkIndex: index,
      payload: {
        videoId,
        domain,
        documentName: 'Video transcript',
        text: chunk,
        chunkIndex: index,
        timestamp: timestampMatch ? timestampMatch[1] : null,
      },
    };
  });
}

async function processYoutubeVideo(videoId, transcriptText, domain = 'youtube') {
  const collectionName = getYoutubeCollectionName(videoId);
  const alreadyProcessed = await collectionExists(collectionName);

  if (alreadyProcessed) {
    return { alreadyProcessed: true, chunkCount: 0 };
  }

  const chunks = buildChunkPayloads(videoId, transcriptText, domain);

  await ensureCollectionByName(collectionName);

  const points = await Promise.all(
    chunks.map(async (chunk) => ({
      id: randomUUID(),
      vector: await generateEmbedding(chunk.text),
      payload: chunk.payload,
    }))
  );

  await upsertVectorsToCollection(collectionName, points);

  return {
    alreadyProcessed: false,
    chunkCount: points.length,
  };
}

function truncateTranscriptForSummary(transcriptText) {
  const words = String(transcriptText || '').split(/\s+/).filter(Boolean);

  if (words.length <= 12000) {
    return words.join(' ');
  }

  return [
    ...words.slice(0, 6000),
    '...',
    ...words.slice(-2000),
  ].join(' ');
}

async function generateVideoSummary(transcriptText) {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content:
            'Summarize this video transcript in 4-6 sentences. Be specific — mention the main topic, key arguments, and any important conclusions. Write plainly. Do not use filler phrases.',
        },
        {
          role: 'user',
          content: truncateTranscriptForSummary(transcriptText),
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Video summary generation failed:', error.message);
    return null;
  }
}

async function answerVideoQuestion(videoId, userMessage, chatHistory = []) {
  const collectionName = getYoutubeCollectionName(videoId);
  const retrievedChunks = await retrieveCollectionContext({
    query: userMessage,
    collectionName,
    topK: 5,
    minScore: 0.5,
  });

  if (retrievedChunks.length === 0) {
    return {
      answer: "I couldn't find relevant content in the transcript for your question.",
      sources: [],
    };
  }

  const answer = await runYoutubeAdvisor({
    userMessage,
    history: Array.isArray(chatHistory)
      ? chatHistory.map((entry) => ({
        role: entry?.role === 'assistant' ? 'assistant' : 'user',
        content: String(entry?.content || ''),
      }))
      : [],
    context: retrievedChunks.map((chunk) => chunk.text),
  });

  const sources = retrievedChunks.map((chunk) => ({
    chunkText: chunk.text,
    score: chunk.score,
    documentName: chunk.documentName,
    chunkIndex: chunk.chunkIndex,
    pageNumber: null,
  }));

  return { answer, sources };
}

module.exports = {
  processYoutubeVideo,
  generateVideoSummary,
  answerVideoQuestion,
  getYoutubeCollectionName,
};
