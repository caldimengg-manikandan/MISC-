const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  steelPerLF: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  },
  shopMHPerLF: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  fieldMHPerLF: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  company: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sourceFile: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Compound index for company and type
priceSchema.index({ company: 1, type: 1 }, { unique: true });

// Pre-save middleware to format type
priceSchema.pre('save', function(next) {
  if (this.type) {
    this.type = this.type.trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Price', priceSchema);