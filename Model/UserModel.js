const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  password_org: {
    type: String,
    default: ''
  },
  course_code: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin', 'learner', 'assessor'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
},
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
