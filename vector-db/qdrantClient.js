const { serverRequire } = require('../shared/runtime');

const { QdrantClient } = serverRequire('@qdrant/js-client-rest');

const client = new QdrantClient({ url: process.env.QDRANT_URL });
const COLLECTION = process.env.QDRANT_COLLECTION;
const VECTOR_SIZE = Number(process.env.EMBEDDING_VECTOR_SIZE || 384);

async function ensureCollection() {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (collection) => collection.name === COLLECTION
  );

  if (!exists) {
    await client.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log(`Qdrant collection "${COLLECTION}" created`);
  }
}

async function upsertVectors(points) {
  await client.upsert(COLLECTION, { points });
}

async function searchVectors({ vector, userId, domain, topK = 5 }) {
  const results = await client.search(COLLECTION, {
    vector,
    limit: topK,
    filter: {
      must: [
        { key: 'userId', match: { value: userId } },
        { key: 'domain', match: { value: domain } },
      ],
    },
    with_payload: true,
  });

  return results;
}

module.exports = { ensureCollection, upsertVectors, searchVectors };
