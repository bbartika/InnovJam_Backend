const Course = require('../Model/CourseSchema_model');
const Assessment = require('../Model/assessment_model');
const Assigned = require('../Model/assignAssessmentSchema');
const User = require('../Model/UserModel');
const StudentAnswer = require('../Model/studentAnswer');
const Question = require('../Model/QuestionModel');
const GradeRange = require("../Model/gradeRangeModel");
const AiModel = require("../Model/AIModel");
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
        if (!assessment) return res.status(404).json({ message: "Assessment not found" });

        const course_details = await Course.findById(assessment.courseId);
        if (!course_details) return res.status(404).json({ message: "Course not found" });

        const AiModelDetails = await AiModel.findById(assessment.ai_model_id);
        if (!AiModelDetails) return res.status(404).json({ message: "AI Model not found" });

        const gradeRanges = await GradeRange.find({ grade_id: assessment.grade_id });

        const questions = await Question.find({ assessmentId: assessment_id }).select("_id");
        if (!questions || questions.length === 0) return res.status(404).json({ message: "Questions not found" });

        const assignedData = await Assigned.find({ assessmentId: assessment_id, status: "completed" }).select("userId status");
        if (!assignedData || assignedData.length === 0) return res.status(404).json({ message: "No assigned students found" });

        // Get student IDs
        const studentIds = assignedData.map(a => a.userId);

        // 🔹 Fetch Student Details from DB
        const students = await User.find({ _id: { $in: studentIds } }).select("_id name email");
        if (!students || students.length === 0) return res.status(404).json({ message: "Students not found" });

        // Fetch student answers
        const studentAnswers = await StudentAnswer.find({
            user_id: { $in: studentIds },
            question_id: { $in: questions.map(q => q._id) }
        });

        if (!studentAnswers || studentAnswers.length === 0) return res.status(404).json({ message: "No student answers found" });

        // Get AI Model Weightage
        const weightage = AiModelDetails.weightage.map(Number);
        if (weightage.length !== 2) return res.status(500).json({ message: "Invalid AI Model Weightage" });

        const firstWeightage = weightage[0] / 100;
        const secondWeightage = weightage[1] / 100;

        const studentScores = {};

        // Calculate scores and determine competency for each question
        studentAnswers.forEach(answer => {
            const userId = answer.user_id.toString();

            const first_score = parseFloat(answer.first_score) * firstWeightage;
            const second_score = parseFloat(answer.second_score) * secondWeightage;

            const sum = first_score + second_score; // Total score for this question

            // Find the grade label for this sum
            const grade = gradeRanges.find(range => sum >= range.startRange && sum <= range.endRange);
            const label = grade ? grade.label : "not-competent"; // Default label if not found

            // Initialize student's record if not present
            if (!studentScores[userId]) {
                studentScores[userId] = { total_first_score: 0, total_second_score: 0, labels: [] };
            }

            // Accumulate scores and store competency label for each question
            studentScores[userId].total_first_score += parseFloat(answer.first_score);
            studentScores[userId].total_second_score += parseFloat(answer.second_score);
            studentScores[userId].labels.push(label); // Store competency for this question
        });

        // Process final results
        const result = students.map(student => {
            const userId = student._id.toString();
            const scores = studentScores[userId] || { total_first_score: 0, total_second_score: 0, labels: [] };

            const final_score = (scores.total_first_score * firstWeightage) + (scores.total_second_score * secondWeightage);

            // Determine overall competency based on all question labels
            const isCompetent = scores.labels.every(label => label === "competent");

            return {
                user_id: student._id,
                student_name: student.name,
                student_email: student.email,
                total_questions: questions.length,
                status: isCompetent ? "competent" : "not-competent",
                final_score: parseFloat(final_score.toFixed(2)),
            };
        });

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

        const AiModelDetails = await AiModel.findById(assessment.ai_model_id);
        if (!AiModelDetails) return res.status(404).json({ message: "AI Model not found" });

        const gradeRanges = await GradeRange.find({ grade_id: assessment.grade_id });

        // 🔍 Fetch all questions for the assessment
        const questions = await Question.find({ assessmentId: assessment_id })
        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this assessment." });
        }

        const grades = await GradeRange.find({ grade_id: assessment.grade_id });

        // 🔍 Fetch the student's answers for these questions
        const studentAnswers = await StudentAnswer.find({
            user_id: user_Id,
            question_id: { $in: questions.map(q => q._id) }
        })

        // 🔍 Fetch student details
        const student = await User.findById(user_Id).select("name email");

        // Get AI Model Weightage
        const weightage = AiModelDetails.weightage.map(Number);
        if (weightage.length !== 2) return res.status(500).json({ message: "Invalid AI Model Weightage" });

        const firstWeightage = weightage[0] / 100;
        const secondWeightage = weightage[1] / 100;

        // 🛠️ Merge questions and student answers
        const mergedData = questions.map(question => {
            const answer = studentAnswers.find(ans => ans.question_id.toString() === question._id.toString());

            const first_score = parseFloat(answer.first_score) * firstWeightage;
            const second_score = parseFloat(answer.second_score) * secondWeightage;

            const sum = first_score + second_score; // Total score for this question

            // Find the grade label for this sum
            const grade = gradeRanges.find(range => sum >= range.startRange && sum <= range.endRange);
            const label = grade ? grade.label : "not-competent";

            return {
                question_id: question._id,
                question_number: question.question_number,
                question_instruction: question.question_instruction,
                question: question.question,
                suggested_answer: question.suggested_answer,
                student_answer: answer ? answer.student_answer : null,
                user_Id: answer ? answer.user_id.toString() : null,
                feedback: answer ? answer.feedback : null,
                status: label
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

        const question = await Question.findById(question_id);

        if (!question) {
            return res.status(400).json({ message: "Question is not found." })
        }

        const assessment = await Assessment.findById(question.assessmentId);

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

