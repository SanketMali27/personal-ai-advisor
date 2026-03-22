const { generateEmbedding } = require('../embeddings/embedder');
const { searchVectors } = require('../../vector-db/qdrantClient');

async function retrieveContext({ query, userId, domain, topK = 5 }) {
  const queryVector = await generateEmbedding(query);
  const results = await searchVectors({
    vector: queryVector,
    userId,
    domain,
    topK,
  });

  return results.map((result) => result.payload.text);
}

module.exports = { retrieveContext };
