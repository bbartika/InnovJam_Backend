const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    range: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});

const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade

