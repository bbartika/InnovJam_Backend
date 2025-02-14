const ArchivedStudentAnswer = require('../Model/archivedStudentAnswerModel');
const Assigned = require('../Model/assignAssessmentSchema');
const Question = require('../Model/QuestionModel');
const mongoIdVerification = require('../services/mongoIdValidation');

const getAllArchiveStudentResponseByAssessmentId = async (req, res) => {
    const { assessent_id } = req.query;

    try {
        if (!mongoIdVerification(assessent_id)) {
            return res.status(400).json({ message: "Invalid assessment ID.", status: false });
        }

        const assignedAssessment = await Assigned.findOne({ assessmentId: assessent_id });

        if (!assignedAssessment) {
            return res.status(404).json({ message: "Student answer not found.", status: false });
        }

        const questions = await Question.find({ assessmentId: assessent_id });

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

module.exports = {
    removeArchiveStudentResponse,
    getAllArchiveStudentResponseByAssessmentId,
    getArchiveStudentResponseByUserIdAndAssessentId
}
