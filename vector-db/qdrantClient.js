const { serverRequire } = require('../shared/runtime');

const { QdrantClient } = serverRequire('@qdrant/js-client-rest');

const VECTOR_SIZE = Number(process.env.EMBEDDING_VECTOR_SIZE || 384);
const client = new QdrantClient({
  url: 'http://localhost:6333',
  checkCompatibility: false,
});

function getCollectionName() {
  if (!process.env.QDRANT_COLLECTION) {
    throw new Error('QDRANT_COLLECTION is not configured');
  }

  return process.env.QDRANT_COLLECTION;
}

function wrapQdrantError(error) {
  if (error?.cause?.code === 'ENOTFOUND') {
    throw new Error(
      `Could not resolve Qdrant host "${error.cause.hostname}". Check QDRANT_URL and verify DNS/network access from this machine.`
    );
  }

  throw error;
}

async function ensureCollection() {
  try {
    const collectionName = getCollectionName();
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (collection) => collection.name === collectionName
    );

    if (!exists) {
      await client.createCollection(collectionName, {
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
      });
      console.log(`Qdrant collection "${collectionName}" created`);
    }
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function upsertVectors(points) {
  try {
    await client.upsert(getCollectionName(), { points });
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function searchVectors({ vector, userId, domain, topK = 5 }) {
  try {
    const results = await client.search(getCollectionName(), {
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
  } catch (error) {
    wrapQdrantError(error);
  }
}

module.exports = client;
module.exports.ensureCollection = ensureCollection;
module.exports.upsertVectors = upsertVectors;
module.exports.searchVectors = searchVectors;
