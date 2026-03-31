const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: String,
    domain: {
      type: String,
      enum: ['medical', 'education', 'finance', 'legal'],
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'indexed', 'failed'],
      default: 'processing',
    },
    summary: { type: String, default: null },
    chunkCount: { type: Number, default: 0 },
    mimeType: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
