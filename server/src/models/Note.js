const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['personal', 'general'],
    default: 'personal'
  },
  position: {
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 }
  },
  isPinned: {
    type: Boolean,
    default: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  color: {
    type: String,
    default: '#e0f7fa' // Default light cyan
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
