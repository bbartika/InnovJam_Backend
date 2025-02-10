const Course = require('../Model/CourseSchema_model');
const Assessment = require('../Model/assessment_model');
const Assigned = require('../Model/assignAssessmentSchema');
const User = require('../Model/UserModel');
const StudentAnswer = require('../Model/studentAnswer');
const Question = require('../Model/QuestionModel');
const mongoIdVerification = require('../services/mongoIdValidation');

const getStudentAndAssessmentDetails = async (req, res) => {
    const { course_id } = req.query;
    try {
        if (!mongoIdVerification(course_id)) {
            return res.status(400).json({ message: "Invalid course ID." });
        }

        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const assessments = await Assessment.find({ courseId: course_id });

        const mappedData = await Promise.all(
            assessments.map(async (assessment) => {
                const totalAssigned = await Assigned.countDocuments({ assessmentId: assessment._id });
                const totalCompleted = await Assigned.countDocuments({
                    assessmentId: assessment._id,
                    status: "completed"
                });

                return {
                    assessmentId: assessment._id,
                    courseName: course.course_name,
                    assessmentName: assessment.assessment_name,
                    assessmentType: assessment.assessment_type,
                    totalAssigned,
                    totalCompleted
                };
            })
        );

        return res.status(200).json({ mappedData });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const getStudentScore = async (req, res) => {
    const { assessment_id } = req.query;

    try {
        if (!mongoIdVerification(assessment_id)) {
            return res.status(400).json({ message: "Invalid assessment ID." });
        }

        const assessment = await Assessment.findById(assessment_id).select("-assessment_instruction -case_study_context");

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        const course_details = await Course.findById(assessment.courseId);
        if (!course_details) {
            return res.status(404).json({ message: "Course not found" });
        }

        const questions = await Question.find({ assessmentId: assessment_id }).select("_id");
        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "Questions not found" });
        }

        const assignedData = await Assigned.find({ assessmentId: assessment_id }).select("userId");
        if (!assignedData || assignedData.length === 0) {
            return res.status(404).json({ message: "No assigned students found" });
        }

        // Get student IDs
        const studentIds = assignedData.map(a => a.userId);

        // Fetch student answers
        const studentAnswers = await StudentAnswer.find({
            user_id: { $in: studentIds },
            question_id: { $in: questions.map(q => q._id) }
        });

        if (!studentAnswers || studentAnswers.length === 0) {
            return res.status(404).json({ message: "No student answers found" });
        }

        // Calculate total score, attempted questions, and total questions per student
        const studentScores = {};
        studentAnswers.forEach(answer => {
            const userId = answer.user_id.toString();

            if (!studentScores[userId]) {
                studentScores[userId] = { totalScore: 0, attemptedQuestions: 0, totalQuestions: questions.length };
            }

            if (answer.gemini_score !== null) {
                studentScores[userId].totalScore += answer.gemini_score || 0;
                studentScores[userId].attemptedQuestions += 1;
            }
        });

        // Fetch student details
        const students = await User.find({ _id: { $in: studentIds } }).select("name email");

        // Map student scores with student details
        const result = students.map(student => ({
            user_id: student._id,
            student_name: student.name,
            student_email: student.email,
            course_total_marks: course_details.total_marks,
            total_score: studentScores[student._id]?.totalScore || 0,
            attempted_questions: studentScores[student._id]?.attemptedQuestions || 0,
            total_questions: questions.length || 0
        }));

        return res.status(200).json({ assessment, result });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getStudentAnswerResponse = async (req, res) => {
    const { user_Id, assessment_id } = req.query;

    try {
        if (!mongoIdVerification(user_Id) || !mongoIdVerification(assessment_id)) {
            return res.status(400).json({ message: "Invalid user ID or assessment ID." });
        }

        // 🔍 Check if the assessment exists
        const assessment = await Assessment.findById(assessment_id).select("-assessmentId");
        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        // 🔍 Fetch all questions for the assessment
        const questions = await Question.find({ assessmentId: assessment_id })
        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this assessment." });
        }

        // 🔍 Fetch the student's answers for these questions
        const studentAnswers = await StudentAnswer.find({
            user_id: user_Id,
            question_id: { $in: questions.map(q => q._id) }
        })

        // 🔍 Fetch student details
        const student = await User.findById(user_Id).select("name email");

        // 🛠️ Merge questions and student answers
        const mergedData = questions.map(question => {
            const answer = studentAnswers.find(ans => ans.question_id.toString() === question._id.toString());

            return {
                question_id: question._id,
                question_number: question.question_number,
                question_instruction: question.question_instruction,
                question: question.question,
                suggested_answer: question.suggested_answer,
                student_answer: answer ? answer.student_answer : null,
                user_Id: answer.user_id,
                feedback: answer ? answer.feedback : null,
            };
        });

        return res.status(200).json({
            student_name: student.name,
            assessment,
            studentResponses: mergedData
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAIScoreReport = async (req, res) => {
    const { user_id, question_id } = req.query;

    try {

        if (!mongoIdVerification(user_id) || !mongoIdVerification(question_id)) {
            return res.status(400).json({ message: "Invalid user ID or question ID." });
        }

        const aiScoreReport = await StudentAnswer.findOne({ user_id: user_id, question_id: question_id })

        return res.status(200).json({ aiScoreReport: aiScoreReport });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


module.exports = {
    getStudentAndAssessmentDetails,
    getStudentScore,
    getStudentAnswerResponse,
    getAIScoreReport
}

