const mongoose = require('mongoose');

const snapSchema = new mongoose.Schema({
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 200
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  }
}, {
  timestamps: true
});

// Index for better query performance
snapSchema.index({ author: 1, createdAt: -1 });
snapSchema.index({ expiresAt: 1 });

// Virtual for views count
snapSchema.virtual('viewsCount').get(function() {
  return this.views.length;
});

// Virtual for reactions count
snapSchema.virtual('reactionsCount').get(function() {
  return this.reactions.length;
});

// Ensure virtual fields are serialized
snapSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Snap', snapSchema);