const mongoose = require('mongoose');

// Assuming 'Course' and 'Assessment' models are already defined
const coursewareSchema = new mongoose.Schema({
  fileName: {
    type: String, // Name of the uploaded file
    required: true,
  },
  file: {
    type: String, // Path or URL of the uploaded file
    required: true,
  },
  description: {
    type: String, // Optional description field
    required: false,
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Reference to the Course model
    required: false,
  },
  course_name: {
    type: String, // Name of the assessment
    required: false,
  },
  assessment_name: {
    type: String, // Name of the assessment
  },
  assessment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'assessment_model', // Reference to the Assessment model
  },
}, { timestamps: true });

const Courseware = mongoose.model('Courseware', coursewareSchema);
module.exports = Courseware;
