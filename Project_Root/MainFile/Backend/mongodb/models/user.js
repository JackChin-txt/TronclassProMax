const mongoose = require('mongoose');
const majors = require('./majors.json');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  walletId: { type: String, required: true, unique: true },
  points:   { type: Number, default: 0 },
  role: {
    type: String,
    enum: ['student', 'mentor'],
    default: 'student',
    required: true
  },
  major: {
    type: String,
    enum: majors,
    required: true
  },
  admin: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
