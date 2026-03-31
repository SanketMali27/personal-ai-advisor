const Document = require('../models/Document');
const path = require('path');
const groq = require('../../ai-services/groqClient');
const { indexDocument, extractText } = require('../../ai-services/rag/indexer');

const SUMMARY_PROMPT =
  'Summarize this document in 3-5 sentences. Be specific — mention key values, dates, names, or figures if present. Write plainly for a non-expert. Skip filler phrases. Get straight to what it contains.';

exports.uploadDocument = async (req, res, next) => {
  try {
    const { domain } = req.body;
    const supportedExtensions = new Set(['.pdf', '.txt']);

    if (!domain) {
      return res.status(400).json({ error: 'domain is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const ext = req.file.originalname
      .slice(req.file.originalname.lastIndexOf('.'))
      .toLowerCase();

    if (!supportedExtensions.has(ext)) {
      return res.status(400).json({
        error: 'Only PDF and TXT files are supported right now',
      });
    }

    const doc = await Document.create({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      domain,
      status: 'processing',
    });

    indexDocument(req.file.path, doc._id.toString(), req.user.id, domain)
      .then(async (chunkCount) => {
        doc.status = 'indexed';
        doc.chunkCount = chunkCount;
        await doc.save();
      })
      .catch(async (err) => {
        console.error('Indexing failed:', err);
        doc.status = 'failed';
        await doc.save();
      });

    res.status(202).json({
      message: 'Document uploaded, indexing in progress',
      doc,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserDocuments = async (req, res, next) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.domain) {
      filter.domain = req.query.domain;
      filter.status = 'indexed';
    }

    const docs = await Document.find(filter).sort('-createdAt');
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

exports.summarizeDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.summary !== null && document.summary !== undefined) {
      return res.json({ summary: document.summary, cached: true });
    }

    const filePath = path.join(__dirname, '..', 'uploads', document.filename);
    const rawText = await extractText(filePath);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        {
          role: 'user',
          content: rawText.slice(0, 18000),
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: 'Summary generation failed' });
    }

    document.summary = summary;
    await document.save();

    res.json({ summary, cached: false });
  } catch (err) {
    console.error('Summary generation failed:', err.message);
    res.status(500).json({ error: 'Summary generation failed' });
  }
};
