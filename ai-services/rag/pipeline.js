const { retrieveContext } = require('./retriever');

async function runRagPipeline({
  query,
  userId,
  domain,
  topK = 5,
  runner,
  runnerInput = {},
}) {
  let retrievedChunks = [];

  try {
    retrievedChunks = await retrieveContext({
      query,
      userId,
      domain,
      topK,
    });
  } catch (error) {
    console.error('Context retrieval failed:', error.message);
  }

  const sources = retrievedChunks
    .filter((chunk) => chunk.text)
    .map((chunk) => ({
      chunkText: chunk.text,
      score: chunk.score,
      documentName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
    }));

  const answer = await runner({
    ...runnerInput,
    context: sources.map((source) => source.chunkText),
  });

  return { answer, sources };
}

module.exports = { runRagPipeline };
