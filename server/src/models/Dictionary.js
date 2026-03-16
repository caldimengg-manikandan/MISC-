const mongoose = require('mongoose');

const dictionarySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'stair_type', 
      'grating_type', 
      'stringer_size', 
      'finish_option', 
      'connection_type',
      'platform_type',
      'mounting_type'
    ],
    index: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness per category
dictionarySchema.index({ category: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('Dictionary', dictionarySchema);
