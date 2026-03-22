const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agentType: {
      type: String,
      enum: ['doctor', 'teacher', 'finance', 'lawyer'],
      required: true,
    },
    title: { type: String, default: 'New Chat' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
