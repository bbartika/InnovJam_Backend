const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    }
});


const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade

