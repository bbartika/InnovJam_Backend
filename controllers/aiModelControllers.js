const AIModel = require('../Model/AIModel');
const Assessment = require('../Model/assessment_model');

const validateArrayLength = (arr) => Array.isArray(arr) && arr.length === 2;

// ✅ Create AI Model
const createAiModel = async (req, res) => {
    try {
        const { llm_name, model_type, weightage } = req.body;

        if (!validateArrayLength(llm_name) || !validateArrayLength(model_type) || !validateArrayLength(weightage)) {
            return res.status(400).json({ success: false, message: "Each field must be an array with exactly two elements." });
        }

        const newModel = new AIModel({ llm_name, model_type, weightage });
        await newModel.save();

        res.status(201).json({ success: true, message: "AI Model created successfully", data: newModel });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating AI Model", error: error.message });
    }
};

// ✅ Update AI Model
const updateAiModel = async (req, res) => {
    const { id } = req.params;
    const { llm_name, model_type, weightage } = req.body;

    try { 
        // Fetch the model first
        const existingModel = await AIModel.findById(id);
        if (!existingModel) {
            return res.status(404).json({ success: false, message: "AI Model not found" });
        }

        // Validate input arrays if provided
        if (llm_name && !validateArrayLength(llm_name)) {
            return res.status(400).json({ success: false, message: "llm_name must contain exactly two elements." });
        }
        if (model_type && !validateArrayLength(model_type)) {
            return res.status(400).json({ success: false, message: "model_type must contain exactly two elements." });
        }
        if (weightage && !validateArrayLength(weightage)) {
            return res.status(400).json({ success: false, message: "weightage must contain exactly two elements." });
        }

        // Perform the update
        const updatedModel = await AIModel.findByIdAndUpdate(id, req.body, { new: true });

        res.status(200).json({ success: true, message: "AI Model updated successfully", data: updatedModel });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating AI Model", error: error.message });
    }
};

// ✅ Get AI Model by ID
const getAiModelById = async (req, res) => {
    const { id } = req.params;
    try {
        const model = await AIModel.findById(id);
        if (!model) {
            return res.status(404).json({ success: false, message: "AI Model not found" });
        }
        res.status(200).json({ success: true, data: model });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching AI Model", error: error.message });
    }
};

// ✅ Get All AI Models
const getAllAiModel = async (req, res) => {
    try {
        const models = await AIModel.find();
        res.status(200).json({ success: true, data: models });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching AI Models", error: error.message });
    }
};

// ✅ Remove AI Model
const removeAiModel = async (req, res) => {
    const { id } = req.params;

    try {
        const assessment = await Assessment.findOne({ ai_model_id: id });
        if (assessment) {
            return res.status(400).json({ success: false, message: "Cannot delete an AI Model with associated assessments" });
        }
        const deletedModel = await AIModel.findByIdAndDelete(id);
        if (!deletedModel) {
            return res.status(404).json({ success: false, message: "AI Model not found" });
        }
        res.status(200).json({ success: true, message: "AI Model deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting AI Model", error: error.message });
    }
};

module.exports = { createAiModel, updateAiModel, getAiModelById, getAllAiModel, removeAiModel };
