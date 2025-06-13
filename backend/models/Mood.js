const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 280
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'angry', 'love', 'surprised', 'neutral'],
    default: 'neutral'
  },
  backgroundColor: {
    type: String,
    default: '#FF2E93'
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  }
}, {
  timestamps: true
});

// Index for better query performance
moodSchema.index({ author: 1, createdAt: -1 });
moodSchema.index({ createdAt: -1 });

// Virtual for likes count
moodSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Ensure virtual fields are serialized
moodSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Mood', moodSchema);