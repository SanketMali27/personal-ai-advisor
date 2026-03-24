const { serverRequire } = require('../../shared/runtime');

const axios = serverRequire('axios');
const HF_API_KEY = process.env.HF_API_KEY;
const HF_EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

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

    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_EMBEDDING_MODEL}`,
      {
        inputs: text.replace(/\n/g, ' '),
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
