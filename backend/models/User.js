const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profilePic: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: [150, 'Bio cannot exceed 150 characters']
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ name: 'text', username: 'text' });

// Virtual for posts count
userSchema.virtual('postsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to ensure data consistency
userSchema.pre('save', function(next) {
  // Ensure username is lowercase
  if (this.username) {
    this.username = this.username.toLowerCase();
  }
  
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);