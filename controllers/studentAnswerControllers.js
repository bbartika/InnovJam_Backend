const StudentAnswer = require('../Model/studentAnswer');
const mongoIdVerification = require('../services/mongoIdValidation');

// 📌 Submit a student answer
const studentAnswerResponse = async (req, res) => {
    try {
        const { user_id, question_id, student_answer, student_response_formated } = req.body;

        if (!mongoIdVerification(user_id) || !mongoIdVerification(question_id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID or question ID." });
        }

        if (!user_id || !question_id || !student_answer) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // Check if an answer already exists for the same user and question
        let existingAnswer = await StudentAnswer.findOne({ user_id, question_id });

        if (existingAnswer) {
            // Update existing student answer
            existingAnswer.student_answer = student_answer;
            existingAnswer.student_response_formated = student_response_formated;
            await existingAnswer.save();
            return res.status(200).json({
                success: true,
                message: "Student answer updated successfully.",
                data: existingAnswer,
            });
        } else {
            // Create a new student answer
            const newAnswer = new StudentAnswer({
                user_id,
                question_id,
                status: 1,
                student_answer,
                student_response_formated
            });

            await newAnswer.save();

            return res.status(201).json({
                success: true,
                message: "Student answer submitted successfully.",
                data: newAnswer,
            });
        }
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

const feebackByAssessor = async (req, res) => {
    const { user_id, question_id } = req.query;
    const { feedback } = req.body;

    try {
        if (!mongoIdVerification(user_id) || !mongoIdVerification(question_id)) {
            return res.status(400).json({ message: "Invalid user ID or question ID." });
        }

        if (!feedback) {
            return res.status(400).json({ message: "Feedback is required." });
        }

        const studentAnswer = await StudentAnswer.findOne({ user_id: user_id, question_id: question_id });

        if (!studentAnswer) {
            return res.status(404).json({ message: "Student answer not found." });
        }

        studentAnswer.human_assess_remarks = feedback;
        studentAnswer.isMarked = true;

        await studentAnswer.save();

        return res.status(200).json({ message: "Feedback saved successfully!" });

    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

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

const getStudentAnswerByQuestionId = async (req, res) => {
    const { user_id, question_id } = req.query;

    try {
        if (!user_id || !question_id) {
            return res.status(400).json({ success: false, message: "user_id and question_id are required." });
        }

        const answer = await StudentAnswer.findOne({ user_id, question_id }).select('student_answer');

        if (!answer) {
            return res.status(404).json({ success: false, message: "Student answer not found." });
        }

        return res.status(200).json({
            success: true,
            student_answer: answer.student_answer,
        });

    } catch (error) {
        console.error("Error in getStudentAnswerByQuestionId:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    studentAnswerResponse,
    updateStudentAnswer,
    getAllStudentAnswers,
    getStudentAnswerById,
    getStudentAnswerByQuestionId,
    feebackByAssessor
};
