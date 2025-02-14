const mongoose = require('mongoose');

const aiSchema = new mongoose.Schema({
    llm_name: {
        type: String,
        required: true
    },
    model_type: {
        type: String,
        required: true
    },
    weightage: {
        type: String,
        required: true
    }
})

const AIModel = mongoose.model('AI', aiSchema);

module.exports = AIModel;