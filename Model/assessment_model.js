
const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  assessment_name: {
    type: String,
    required: true
  },
  grade_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: true
  },
  ai_model_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AI',
    required: true
  },
  assessment_type: {
    type: String,
    required: true
  },
  assessment_instruction: {
    type: [String],
    required: false
  },
  case_study_context: {
    type: String,
    required: false
  },
  duration: {
    type: String,
    required: false
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courseschema',
    required: true
  },
  assessment_file_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'files'
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
