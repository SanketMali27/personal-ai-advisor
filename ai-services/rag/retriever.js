const { generateEmbedding } = require('../embeddings/embedder');
const { searchCollection, searchVectors } = require('../../vector-db/qdrantClient');
const Document = require('../../server/models/Document');

async function retrieveContext({ query, userId, domain, topK = 5 }) {
  const queryVector = await generateEmbedding(query);
  const results = await searchVectors({
    vector: queryVector,
    userId,
    domain,
    topK: topK * 3,
  });
  const documentCache = new Map();

  const enrichedResults = await Promise.all(results.map(async (result) => {
    const payload = result.payload || {};
    let documentName = payload.documentName;

    if (!documentName && payload.documentId) {
      if (!documentCache.has(payload.documentId)) {
        documentCache.set(
          payload.documentId,
          Document.findById(payload.documentId)
            .lean()
            .catch(() => null)
        );
      }

      const document = await documentCache.get(payload.documentId);
      documentName = document?.originalName || document?.filename;
    }

    return {
      text: payload.text || '',
      score: typeof result.score === 'number' ? result.score : 0,
      documentName: documentName || 'Unknown document',
      chunkIndex: typeof payload.chunkIndex === 'number' ? payload.chunkIndex : 0,
      pageNumber:
        typeof payload.pageNumber === 'number' ? payload.pageNumber : null,
    };
  }));

  const uniqueResults = [];
  const seen = new Set();

  for (const result of enrichedResults) {
    const dedupeKey = [
      result.documentName,
      result.chunkIndex,
      result.pageNumber ?? 'na',
      result.text,
    ].join('::');

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    uniqueResults.push(result);

    if (uniqueResults.length === topK) {
      break;
    }
  }

  return uniqueResults;
}

async function retrieveCollectionContext({
  query,
  collectionName,
  topK = 5,
  minScore = 0,
  filter,
}) {
  const queryVector = await generateEmbedding(query);
  const results = await searchCollection({
    collectionName,
    vector: queryVector,
    filter,
    topK,
  });

  const uniqueResults = [];
  const seen = new Set();

  for (const result of results) {
    const payload = result.payload || {};
    const score = typeof result.score === 'number' ? result.score : 0;

    if (score < minScore || !payload.text) {
      continue;
    }

    const enrichedResult = {
      text: payload.text || '',
      score,
      documentName: payload.documentName || 'Video transcript',
      chunkIndex: typeof payload.chunkIndex === 'number' ? payload.chunkIndex : 0,
      pageNumber: null,
      timestamp: payload.timestamp || null,
    };

    const dedupeKey = [
      enrichedResult.documentName,
      enrichedResult.chunkIndex,
      enrichedResult.timestamp ?? 'na',
      enrichedResult.text,
    ].join('::');

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    uniqueResults.push(enrichedResult);

    if (uniqueResults.length === topK) {
      break;
    }
  }

  return uniqueResults;
}

module.exports = { retrieveContext, retrieveCollectionContext };
