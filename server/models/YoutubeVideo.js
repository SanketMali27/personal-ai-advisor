const mongoose = require('mongoose');

const youtubeSourceSchema = new mongoose.Schema(
  {
    chunkText: { type: String, required: true },
    score: { type: Number, required: true },
    documentName: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: null },
  },
  { _id: false }
);

const youtubeMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    message: { type: String, required: true },
    sources: { type: [youtubeSourceSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const youtubeVideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String, default: '' },
  summary: { type: String, default: null },
  wordCount: { type: Number, default: 0 },
  estimatedMinutes: { type: Number, default: 0 },
  qualityWarning: { type: Boolean, default: false },
  chunkCount: { type: Number, default: 0 },
  messages: { type: [youtubeMessageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

youtubeVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('YoutubeVideo', youtubeVideoSchema);
