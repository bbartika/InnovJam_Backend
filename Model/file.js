const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
