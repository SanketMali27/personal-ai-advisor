const Document = require('../models/Document');
const { indexDocument } = require('../../ai-services/rag/indexer');

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
    const docs = await Document.find({ userId: req.user.id }).sort('-createdAt');
    res.json(docs);
  } catch (err) {
    next(err);
  }
};
