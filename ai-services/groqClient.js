const { serverRequire } = require('../shared/runtime');

const Groq = serverRequire('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = groq;
