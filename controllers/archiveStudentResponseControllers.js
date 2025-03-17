const ArchivedStudentAnswer = require('../Model/archivedStudentAnswerModel');
const Assigned = require('../Model/assignAssessmentSchema');
const archiveStudentModal = require('../Model/archivedStudentAnswerModel');
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const mongoIdVerification = require('../services/mongoIdValidation');

const getAllArchiveStudentResponseByAssessmentId = async (req, res) => {
    const { assessment_id } = req.query;

    try {
        if (!mongoIdVerification(assessment_id)) {
            return res.status(400).json({ message: "Invalid assessment ID.", status: false });
        }

        const assignedAssessment = await Assigned.findOne({ assessmentId: assessment_id });

        if (!assignedAssessment) {
            return res.status(404).json({ message: "Student answer not found.", status: false });
        }

        const questions = await Question.find({ assessmentId: assessment_id });

        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this assessment.", status: false });
        }

        const studentAnswers = await ArchivedStudentAnswer.find({ user_id: assignedAssessment.userId, question_id: { $in: questions.map(q => q._id) } });

        if (!studentAnswers || studentAnswers.length === 0) {
            return res.status(404).json({ message: "No student answers found for this assessment.", status: false });
        }

        return res.status(200).json({ studentAnswers: studentAnswers, status: true });

    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const getArchiveStudentResponseByUserIdAndAssessentId = async (req, res) => {
    const { user_id, question_id } = req.query;

    try {
        if (!mongoIdVerification(user_id) || !mongoIdVerification(question_id)) {
            return res.status(400).json({ message: "Invalid user ID or question ID." });
        }

        const studentAnswer = await ArchivedStudentAnswer.find({ user_id, question_id });

        if (!studentAnswer) {
            return res.status(404).json({ message: "Student answer not found.", status: false });
        }

        return res.status(200).json({ studentAnswer: studentAnswer, status: true });

    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const removeArchiveStudentResponse = async (req, res) => {
    const { user_id, question_id } = req.query;

    try {
        if (!mongoIdVerification(user_id) || !mongoIdVerification(question_id)) {
            return res.status(400).json({ message: "Invalid user ID or question ID." });
        }

        const studentAnswer = await ArchivedStudentAnswer.deleteOne({ user_id, question_id });
        if (!studentAnswer) {
            return res.status(404).json({ message: "Student answer not found.", status: false });
        }
        return res.status(200).json({ message: "Student answer deleted successfully.", status: true });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }

}

const archiveStudentResponse = async (req, res) => {
    const { assessment_id, user_id } = req.query;

    try {
        // Validate IDs
        if (!mongoIdVerification(assessment_id) || !mongoIdVerification(user_id)) {
            return res.status(400).json({ message: "Invalid assessment ID or user ID.", status: false });
        }

        // Fetch all questions for the given assessment ID
        const assessment = await Assessment.findOne({ _id: assessment_id });


        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found.", status: false });
        }

        // Extract question IDs as an array of strings
        const questionIds = await Question.find({ assessmentId: assessment_id }).distinct("_id");

        // Fetch archived student responses using user_id and questionIds
        const archivedResponses = await ArchivedStudentAnswer.find({
            user_id: user_id,
            question_id: { $in: questionIds }
        });

        // Remove duplicates if any
        const uniqueResponses = Array.from(new Map(archivedResponses.map(item => [item._id.toString(), item])).values());

        if (!uniqueResponses.length) {
            return res.status(404).json({ message: "No archived responses found.", status: false });
        }

        return res.status(200).json({ message: "Archived responses retrieved.", data: uniqueResponses, status: true , questionIds });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message, status: false });
    }
};

module.exports = {
    removeArchiveStudentResponse,
    getAllArchiveStudentResponseByAssessmentId,
    getArchiveStudentResponseByUserIdAndAssessentId,
    archiveStudentResponse
}
