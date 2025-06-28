const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

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
  likes: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  comments: {
    type: [commentSchema],
    default: []
  },
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
  return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
moodSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Ensure virtual fields are serialized
moodSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Mood', moodSchema);