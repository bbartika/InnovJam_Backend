const mongoose = require('mongoose');

const gradeRangeSchema = new mongoose.Schema({
    grade_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: true
    },
    label: {
        type: String,
        required: true
    },
    startRange: {
        type: Number,
        required: true
    },
    endRange: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const GradeRange = mongoose.model('Range', gradeRangeSchema);
module.exports = GradeRange