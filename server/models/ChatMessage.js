const mongoose = require('mongoose');

const chatSourceSchema = new mongoose.Schema(
  {
    chunkText: { type: String, required: true },
    score: { type: Number, required: true },
    documentName: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: null },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    type: { type: String, enum: ['chat', 'summary'], default: 'chat' },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    message: { type: String, required: true },
    sources: { type: [chatSourceSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
