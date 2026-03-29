const { serverRequire } = require('../../shared/runtime');

const axios = serverRequire('axios');
const HF_API_KEY = process.env.HF_API_KEY;
const HF_EMBEDDING_MODEL =
  process.env.HF_EMBEDDING_MODEL || 'BAAI/bge-small-en-v1.5';
const HF_INFERENCE_BASE_URL =
  process.env.HF_INFERENCE_BASE_URL ||
  'https://router.huggingface.co/hf-inference/models';

function averagePool(tokenEmbeddings) {
  const dimensions = tokenEmbeddings[0].length;
  const pooled = new Array(dimensions).fill(0);

  for (const tokenEmbedding of tokenEmbeddings) {
    for (let i = 0; i < dimensions; i += 1) {
      pooled[i] += tokenEmbedding[i];
    }
  }

  return pooled.map((value) => value / tokenEmbeddings.length);
}

function normalizeEmbedding(data) {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nestedEmbedding = data.embedding || data.embeddings || data.data;

    if (nestedEmbedding) {
      return normalizeEmbedding(nestedEmbedding);
    }
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Embedding provider returned an empty response');
  }

  if (data.every((value) => typeof value === 'number')) {
    return data;
  }

  if (data.every((value) => Array.isArray(value) && value.every((item) => typeof item === 'number'))) {
    return averagePool(data);
  }

  throw new Error('Embedding provider returned an unexpected response shape');
}

async function generateEmbedding(text) {
  try {
    if (!HF_API_KEY) {
      throw new Error('HF_API_KEY is not configured');
    }

    const normalizedText = String(text || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalizedText) {
      throw new Error('Cannot generate an embedding for empty text');
    }

    const response = await axios.post(
      `${HF_INFERENCE_BASE_URL}/${HF_EMBEDDING_MODEL}`,
      {
        inputs: normalizedText,
        options: {
          wait_for_model: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return normalizeEmbedding(response.data);
  } catch (error) {
    console.error('Embedding error:', error.response?.data || error.message);
    throw new Error('Failed to generate embedding');
  }
}

module.exports = { generateEmbedding };
