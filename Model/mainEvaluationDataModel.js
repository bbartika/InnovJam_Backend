const mongoose = require('mongoose');

const userAssessmentDataSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true }, // Reference to the original assessment
  assessment_name: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
  course_name: { type: String },
  assessment_type: { type: String },
  case_study_context: { type: String },

  competencyCount: { type: Number, default: 0 }, // Number of competent responses
  inCompetentResponses: { type: [String], default: [] }, // Array of question numbers marked as incompetent

  data: [
    {
      question_number: { type: String, required: true },
      question: { type: String, required: true },
      question_instruction: { type: String },
      suggested_answer: { type: Array, default: [] },
      student_answer: { type: String, default: '' },
      sbert_score: { type: Number, default: null },
      roberta_score: { type: Number, default: null },
      distilroberta_score: { type: Number, default: null },
      t5_score: { type: Number, default: null },
      use_score: { type: Number, default: null },
      gpt_score: { type: Number, default: null },
      minilm_score: { type: Number, default: null },
      electra_score: { type: Number, default: null },
      labse_score: { type: Number, default: null },
      gemini_score: { type: Number, default: null },
      feedback: { type: String, default: '' },
      human_assess_remarks: { type: String, default: null },
      isCompetent: { type: Boolean, default: false }, // Mark if competent or not
    },
  ],
});





const mainEvaluationDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'learner', 'assessor', 'trainer'], required: true },
  mainCourseData: [userAssessmentDataSchema], // Array containing assessments per user
}, { timestamps: true });

module.exports = mongoose.model('MainEvaluationData', mainEvaluationDataSchema);
