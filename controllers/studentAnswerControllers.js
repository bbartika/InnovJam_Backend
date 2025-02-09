const StudentAnswer = require('../Model/studentAnswer');
const mongoIdVerification = require('../services/mongoIdValidation');

// 📌 Submit a student answer
const studentAnswerResponse = async (req, res) => {
    try {
        const { user_id, question_id, student_answer } = req.body;

        if (!mongoIdVerification(user_id) || !mongoIdVerification(question_id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID or question ID." });
        }

        if (!user_id || !question_id || !student_answer) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const newAnswer = new StudentAnswer({
            user_id,
            question_id,
            student_answer,
        });

        await newAnswer.save();

        return res.status(201).json({
            success: true,
            message: "Student answer submitted successfully.",
            data: newAnswer,
        });

    } catch (error) {
        console.error("Error in studentAnswerResponse:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// 📌 Update a student's answer (including scores and feedback)
const updateStudentAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedAnswer = await StudentAnswer.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedAnswer) {
            return res.status(404).json({ success: false, message: "Student answer not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Student answer updated successfully.",
            data: updatedAnswer,
        });

    } catch (error) {
        console.error("Error in updateStudentAnswer:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// 📌 Get all student answers
const getAllStudentAnswers = async (req, res) => {
    try {
        const answers = await StudentAnswer.find()
            .populate('user_id', 'name email')
            .populate('question_id', 'question');

        return res.status(200).json({
            success: true,
            count: answers.length,
            data: answers,
        });

    } catch (error) {
        console.error("Error in getAllStudentAnswers:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// 📌 Get a specific student answer by ID
const getStudentAnswerById = async (req, res) => {
    try {
        const { id } = req.params;
        const answer = await StudentAnswer.findById(id)
            .populate('user_id', 'name email')
            .populate('question_id', 'question');

        if (!answer) {
            return res.status(404).json({ success: false, message: "Student answer not found." });
        }

        return res.status(200).json({
            success: true,
            data: answer,
        });

    } catch (error) {
        console.error("Error in getStudentAnswerById:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    studentAnswerResponse,
    updateStudentAnswer,
    getAllStudentAnswers,
    getStudentAnswerById
};
