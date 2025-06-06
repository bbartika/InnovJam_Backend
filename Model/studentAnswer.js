const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema({
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
    student_response_formated: {
        type: String,
        default: null
    },
    first_score: {
        type: String,
        default: null
    },
    second_score: {
        type: String,
        default: null
    },
    first_score_feedback: {
        type: String,
        default: ''
    },
    second_score_feedback: {
        type: String,
        default: ''
    },
    human_assess_remarks: {
        type: String,
        default: null
    }
});

const StudentAnswer = mongoose.model('StudentAnswer', studentAnswerSchema);

module.exports = StudentAnswer