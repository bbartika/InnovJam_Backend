const mongoose = require('mongoose');

const archivedStudentAnswerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    status: {
        type: Number,
        default: 0
    },
    student_answer: {
        type: String,
        required: true
    },
    sbert_score: {
        type: Number,
        default: null
    },
    minilm_score: {
        type: Number,
        default: null
    },
    labse_score: {
        type: Number,
        default: null
    },
    gemini_score: {
        type: Number,
        default: null
    },
    feedback: {
        type: String,
        default: ''
    },
    human_assess_remarks: {
        type: String,
        default: null
    },
    isCompetent: {
        type: Boolean,
        default: false
    },
    isMarked: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: Date.now
    }
});

const ArchivedStudentAnswer = mongoose.model('ArchivedStudentAnswer', archivedStudentAnswerSchema);
module.exports = ArchivedStudentAnswer;
