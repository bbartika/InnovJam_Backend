
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    comparison_count: {
        type: Number,
        default: 0
    },
    comparison_instruction: {
        type: String,
        default: ''
    },
    temperature: {
        type: Number,
        default: 0
    },
    question_number: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    question_instruction: {
        type: String,
        default: ''
    },
    suggested_answer: {
        type: Array,
        default: []
    },
});

const QUestion = mongoose.model('Question', questionSchema);

module.exports = QUestion;
