const { serverRequire } = require('../shared/runtime');

const { QdrantClient } = serverRequire('@qdrant/js-client-rest');

const VECTOR_SIZE = Number(process.env.EMBEDDING_VECTOR_SIZE || 384);
const client = new QdrantClient({
  url: 'http://localhost:6333',
  checkCompatibility: false,
});
const qdrantCreateCollection = client.createCollection.bind(client);
const qdrantCollectionExists = client.collectionExists.bind(client);
const qdrantDeleteCollection = client.deleteCollection.bind(client);
const qdrantSearch = client.search.bind(client);
const qdrantUpsert = client.upsert.bind(client);

function getDefaultCollectionName() {
  if (!process.env.QDRANT_COLLECTION) {
    throw new Error('QDRANT_COLLECTION is not configured');
  }

  return process.env.QDRANT_COLLECTION;
}

function getCollectionName(collectionName) {
  return collectionName || getDefaultCollectionName();
}

function wrapQdrantError(error) {
  if (error?.cause?.code === 'ENOTFOUND') {
    throw new Error(
      `Could not resolve Qdrant host "${error.cause.hostname}". Check QDRANT_URL and verify DNS/network access from this machine.`
    );
  }

  throw error;
}

function isMissingCollectionError(error) {
  const status = error?.status || error?.data?.status?.error;
  const message = String(
    error?.message || error?.data?.status?.error || error?.statusText || ''
  );

  return status === 404 || /404|not found|doesn't exist/i.test(message);
}

function isAlreadyExistsError(error) {
  const message = String(
    error?.message || error?.data?.status?.error || error?.statusText || ''
  );

  return /already exists|409|conflict/i.test(message);
}

async function ensureCollection() {
  try {
    await ensureCollectionByName(getDefaultCollectionName());
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function collectionExists(collectionName) {
  try {
    const targetCollection = getCollectionName(collectionName);
    const result = await qdrantCollectionExists(targetCollection);

    if (typeof result === 'boolean') {
      return result;
    }

    return Boolean(result?.exists);
  } catch (error) {
    if (isMissingCollectionError(error)) {
      return false;
    }

    wrapQdrantError(error);
  }
}

async function ensureCollectionByName(collectionName) {
  try {
    const targetCollection = getCollectionName(collectionName);
    const exists = await collectionExists(targetCollection);

    if (!exists) {
      try {
        await qdrantCreateCollection(targetCollection, {
          vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
        });
        console.log(`Qdrant collection "${targetCollection}" created`);
      } catch (error) {
        if (!isAlreadyExistsError(error)) {
          throw error;
        }
      }
    }
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function upsertVectors(points) {
  try {
    await upsertVectorsToCollection(getDefaultCollectionName(), points);
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function upsertVectorsToCollection(collectionName, points) {
  try {
    await qdrantUpsert(getCollectionName(collectionName), { points });
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function searchVectors({ vector, userId, domain, topK = 5 }) {
  try {
    const results = await searchCollection({
      collectionName: getDefaultCollectionName(),
      vector,
      topK,
      filter: {
        must: [
          { key: 'userId', match: { value: userId } },
          { key: 'domain', match: { value: domain } },
        ],
      },
    });

    return results;
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function searchCollection({ collectionName, vector, filter, topK = 5 }) {
  try {
    const results = await qdrantSearch(getCollectionName(collectionName), {
      vector,
      limit: topK,
      filter,
      with_payload: true,
    });

    return results;
  } catch (error) {
    wrapQdrantError(error);
  }
}

async function deleteCollection(collectionName) {
  try {
    const targetCollection = getCollectionName(collectionName);
    await qdrantDeleteCollection(targetCollection);
    return true;
  } catch (error) {
    if (isMissingCollectionError(error)) {
      return false;
    }

    wrapQdrantError(error);
  }
}

module.exports = client;
module.exports.ensureCollection = ensureCollection;
module.exports.ensureCollectionByName = ensureCollectionByName;
module.exports.collectionExists = collectionExists;
module.exports.upsertVectors = upsertVectors;
module.exports.upsertVectorsToCollection = upsertVectorsToCollection;
module.exports.searchVectors = searchVectors;
module.exports.searchCollection = searchCollection;
module.exports.deleteCollection = deleteCollection;
