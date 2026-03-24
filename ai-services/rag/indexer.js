const fs = require('fs');
const path = require('path');
const { serverRequire } = require('../../shared/runtime');
const pdfParse = serverRequire('pdf-parse');
const { v4: uuidv4 } = serverRequire('uuid');
const { generateEmbedding } = require('../embeddings/embedder');
const {
  ensureCollection,
  upsertVectors,
} = require('../../vector-db/qdrantClient');

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let index = 0;

  while (index < words.length) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
    index += chunkSize - overlap;
  }

  return chunks;
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  return fs.readFileSync(filePath, 'utf-8');
}

async function indexDocument(filePath, documentId, userId, domain) {
  await ensureCollection();

  const rawText = await extractText(filePath);
  const chunks = chunkText(rawText);

  const points = await Promise.all(
    chunks.map(async (chunk, idx) => {
      const vector = await generateEmbedding(chunk);

      return {
        id: uuidv4(),
        vector,
        payload: {
          documentId,
          userId,
          domain,
          chunkIndex: idx,
          text: chunk,
        },
      };
    })
  );

  await upsertVectors(points);
  return points.length;
}

module.exports = { indexDocument, chunkText, extractText };
