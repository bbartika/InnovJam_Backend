
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question_number: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    question_instruction: {
        type: String
    },
    suggested_answer: {
        type: Array,
        default: []
    },
});

const QUestion = mongoose.model('Question', questionSchema);

module.exports = QUestion;
