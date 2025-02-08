const mongoose = require('mongoose');

const assignAssessmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'in_progress', 'completed']
    },
}, { timestamps: true });

module.exports = mongoose.model('AssignAssessment', assignAssessmentSchema);

