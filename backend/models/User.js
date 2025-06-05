const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  profilePic: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
