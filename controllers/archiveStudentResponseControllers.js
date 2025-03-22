const ArchivedStudentAnswer = require('../Model/archivedStudentAnswerModel');
const Assigned = require('../Model/assignAssessmentSchema');
const archiveStudentModal = require('../Model/archivedStudentAnswerModel');
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const AiModel = require("../Model/AIModel");
const GradeRange = require('../Model/gradeRangeModel');
const User = require("../Model/UserModel");
const Course = require("../Model/CourseSchema_model");
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

        // Fetch the assessment by ID
        const assessment = await Assessment.findOne({ _id: assessment_id });

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found.", status: false });
        }

        const aiDetails = await AiModel.findById(assessment.ai_model_id);


        // Get all question IDs for the given assessment
        const questions = await Question.find({ assessmentId: assessment_id });

        if (!questions.length) {
            return res.status(404).json({ message: "No questions found for this assessment.", status: false });
        }

        // Create a map of question IDs to question objects for faster lookup
        const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

        // Fetch archived student responses using user_id and questionIds
        const archivedResponses = await ArchivedStudentAnswer.find({
            user_id: user_id,
            question_id: { $in: Array.from(questionMap.keys()) },
        });

        // Remove duplicates if any
        const uniqueResponses = Array.from(new Map(archivedResponses.map(item => [item._id.toString(), item])).values());

        if (!uniqueResponses.length) {
            return res.status(404).json({ message: "No archived responses found.", status: false });
        }

        // Attach question details to each response
        const responsesWithQuestions = uniqueResponses.map(response => {
            const question = questionMap.get(response.question_id.toString());
            return {
                ...response.toObject(),
                aiDetails,
                question: question ? question.toObject() : null
            };
        });

        return res.status(200).json({ message: "Archived responses retrieved.", data: responsesWithQuestions, status: true });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message, status: false });
    }
};


// const getStudentArchivedScore = async (req, res) => {
//     const { assessment_id } = req.query;

//     try {
//         // ✅ Validate assessment ID
//         if (!mongoIdVerification(assessment_id)) {
//             return res.status(400).json({ message: "Invalid assessment ID.", status: false });
//         }

//         // ✅ Fetch assessment without unnecessary fields
//         const assessment = await Assessment.findById(assessment_id).select("-assessment_instruction -case_study_context");
//         if (!assessment) {
//             return res.status(404).json({ message: "Assessment not found.", status: false });
//         }

//         // ✅ Fetch course details
//         const course_details = await Course.findById(assessment.courseId);
//         if (!course_details) {
//             return res.status(404).json({ message: "Course not found.", status: false });
//         }

//         // ✅ Fetch AI Model details
//         const AiModelDetails = await AiModel.findById(assessment.ai_model_id);
//         if (!AiModelDetails) {
//             return res.status(404).json({ message: "AI Model not found.", status: false });
//         }

//         // ✅ Fetch grade ranges
//         const gradeRanges = await GradeRange.find({ grade_id: assessment.grade_id });
//         if (!gradeRanges || gradeRanges.length === 0) {
//             return res.status(404).json({ message: "Grade ranges not found.", status: false });
//         }

//         // ✅ Fetch questions related to the assessment
//         const questions = await Question.find({ assessmentId: assessment_id }).select("_id");
//         if (!questions || questions.length === 0) {
//             return res.status(404).json({ message: "No questions found for this assessment.", status: false });
//         }

//         // ✅ Fetch assigned students for this assessment
//         const assignedData = await Assigned.find({ assessmentId: assessment_id }).select("userId status");
//         if (!assignedData || assignedData.length === 0) {
//             return res.status(404).json({ message: "No assigned students found.", status: false });
//         }

//         // ✅ Get student IDs
//         const studentIds = assignedData.map(a => a.userId);

//         // ✅ Fetch student details
//         const students = await User.find({ _id: { $in: studentIds } }).select("_id name email");
//         if (!students || students.length === 0) {
//             return res.status(404).json({ message: "Students not found.", status: false });
//         }

//         // ✅ Fetch student archived answers
//         const studentAnswers = await archiveStudentModal.find({
//             user_id: { $in: studentIds },
//             question_id: { $in: questions.map(q => q._id) },
//         });

//         if (!studentAnswers || studentAnswers.length === 0) {
//             return res.status(404).json({ message: "No student answers found.", status: false });
//         }

//         // ✅ Validate AI Model weightage
//         const weightage = AiModelDetails.weightage.map(Number);
//         if (weightage.length !== 2 || weightage[0] + weightage[1] !== 100) {
//             return res.status(500).json({ message: "Invalid AI Model Weightage. The sum of weightages should be 100.", status: false });
//         }

//         // ✅ Weightage values
//         const firstWeightage = weightage[0] / 100;
//         const secondWeightage = weightage[1] / 100;

//         const studentScores = {};

//         // ✅ Calculate scores and determine competency for each question
//         studentAnswers.forEach(answer => {
//             const userId = answer.user_id.toString();

//             // Handle null scores by assigning 0
//             const first_score = parseFloat(answer.first_score || 0) * firstWeightage;
//             const second_score = parseFloat(answer.second_score || 0) * secondWeightage;

//             console.log(first_score + " -> " + second_score);

//             const sum = first_score + second_score; // Total score for this question

//             // ✅ Find the grade label for the score sum
//             const grade = gradeRanges.find(range => sum >= range.startRange && sum <= range.endRange);
//             const label = grade ? grade.label : "not-competent"; // Default label if grade not found

//             // ✅ Initialize student record if not present
//             if (!studentScores[userId]) {
//                 studentScores[userId] = { total_first_score: 0, total_second_score: 0, labels: [] };
//             }

//             // ✅ Accumulate scores and store competency label for each question
//             studentScores[userId].total_first_score += parseFloat(answer.first_score || 0);
//             studentScores[userId].total_second_score += parseFloat(answer.second_score || 0);
//             studentScores[userId].labels.push(label);
//         });


//         // ✅ Process final results for each student
//         const result = students.map(student => {
//             const userId = student._id.toString();
//             const scores = studentScores[userId] || { total_first_score: 0, total_second_score: 0, labels: [] };

//             // ✅ Calculate final score
//             const final_score = (scores.total_first_score * firstWeightage) + (scores.total_second_score * secondWeightage);

//             // ✅ Determine overall competency
//             const isCompetent = scores.labels.every(label => label === "competent");

//             return {
//                 user_id: student._id,
//                 student_name: student.name,
//                 student_email: student.email,
//                 total_questions: questions.length,
//                 status: isCompetent ? "competent" : "not-competent",
//                 final_score: parseFloat(final_score.toFixed(2)),
//             };
//         });

//         return res.status(200).json({
//             message: "Student archived scores retrieved successfully.",
//             assessment,
//             result,
//             status: true
//         });

//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json({
//             message: "Internal Server Error.",
//             error: error.message,
//             status: false
//         });
//     }
// };


const getStudentArchivedScore = async (req, res) => {
    const { assessment_id } = req.query;

    try {
        // ✅ Validate assessment ID
        if (!mongoIdVerification(assessment_id)) {
            return res.status(400).json({ message: "Invalid assessment ID.", status: false });
        }

        // ✅ Fetch assessment without unnecessary fields
        const assessment = await Assessment.findById(assessment_id).select("-assessment_instruction -case_study_context");
        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found.", status: false });
        }

        // ✅ Fetch course details
        const course_details = await Course.findById(assessment.courseId);
        if (!course_details) {
            return res.status(404).json({ message: "Course not found.", status: false });
        }

        // ✅ Fetch AI Model details
        const AiModelDetails = await AiModel.findById(assessment.ai_model_id);
        if (!AiModelDetails) {
            return res.status(404).json({ message: "AI Model not found.", status: false });
        }

        // ✅ Fetch grade ranges
        const gradeRanges = await GradeRange.find({ grade_id: assessment.grade_id });
        if (!gradeRanges || gradeRanges.length === 0) {
            return res.status(404).json({ message: "Grade ranges not found.", status: false });
        }

        // ✅ Fetch questions related to the assessment
        const questions = await Question.find({ assessmentId: assessment_id }).select("_id");
        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this assessment.", status: false });
        }

        // ✅ Fetch assigned students for this assessment
        const assignedData = await Assigned.find({ assessmentId: assessment_id }).select("userId status");
        if (!assignedData || assignedData.length === 0) {
            return res.status(404).json({ message: "No assigned students found.", status: false });
        }

        // ✅ Get student IDs
        const studentIds = assignedData.map(a => a.userId);

        // ✅ Fetch student details
        const students = await User.find({ _id: { $in: studentIds } }).select("_id name email");
        if (!students || students.length === 0) {
            return res.status(404).json({ message: "Students not found.", status: false });
        }

        // ✅ Fetch student archived answers
        const studentAnswers = await archiveStudentModal.find({
            user_id: { $in: studentIds },
            question_id: { $in: questions.map(q => q._id) },
        });

        if (!studentAnswers || studentAnswers.length === 0) {
            return res.status(404).json({ message: "No student answers found.", status: false });
        }

        // ✅ Validate AI Model weightage
        const weightage = AiModelDetails.weightage.map(Number);
        if (weightage.length !== 2 || weightage[0] + weightage[1] !== 100) {
            return res.status(500).json({ message: "Invalid AI Model Weightage. The sum of weightages should be 100.", status: false });
        }

        // ✅ Weightage values as floats
        const firstWeightage = parseFloat(weightage[0]) / 100;
        const secondWeightage = parseFloat(weightage[1]) / 100;

        const studentScores = {};

        // ✅ Calculate scores and determine competency for each question
        studentAnswers.forEach(answer => {
            const userId = answer.user_id.toString();

            // Handle null scores by assigning 0 and ensure float values
            const first_score = parseFloat(answer.first_score || 0) * firstWeightage;
            const second_score = parseFloat(answer.second_score || 0) * secondWeightage;

            const sum = parseFloat((first_score + second_score).toFixed(2)); // Total score for this question

            // ✅ Initialize student record if not present
            if (!studentScores[userId]) {
                studentScores[userId] = { total_score: 0, total_first_score: 0, total_second_score: 0 };
            }

            // ✅ Accumulate total scores for the student
            studentScores[userId].total_score += sum;
            studentScores[userId].total_first_score += parseFloat(answer.first_score || 0);
            studentScores[userId].total_second_score += parseFloat(answer.second_score || 0);
        });

        // ✅ Process final results for each student
        const result = students.map(student => {
            const userId = student._id.toString();
            const scores = studentScores[userId] || { total_score: 0, total_first_score: 0, total_second_score: 0 };

            // ✅ Calculate the final weighted score
            const final_score = parseFloat(scores.total_score.toFixed(2));

            // ✅ Determine overall competency based on total weighted score
            const grade = gradeRanges.find(range => final_score >= range.startRange && final_score <= range.endRange);
            const overall_status = grade ? grade.label : "not-competent";

            return {
                user_id: student._id,
                student_name: student.name,
                student_email: student.email,
                total_questions: questions.length,
                status: overall_status,
                final_score: final_score,
            };
        });

        return res.status(200).json({
            message: "Student archived scores retrieved successfully.",
            assessment,
            result,
            status: true
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            message: "Internal Server Error.",
            error: error.message,
            status: false
        });
    }
};

module.exports = {
    removeArchiveStudentResponse,
    getAllArchiveStudentResponseByAssessmentId,
    getArchiveStudentResponseByUserIdAndAssessentId,
    archiveStudentResponse,
    getStudentArchivedScore
}
