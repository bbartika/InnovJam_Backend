const AssignAssessment = require('../Model/assignAssessmentSchema');
const User = require('../Model/UserModel')
const CourseSchema = require('../Model/CourseSchema_model');
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const GradeRange = require('../Model/gradeRangeModel');
const StudentAnswer = require('../Model/studentAnswer');
const evaluateByAI = require('./evaluationByAi');
const AIModel = require('../Model/AIModel');
const ArchivedStudentAnswer = require('../Model/archivedStudentAnswerModel');
const mongoIdVerification = require('../services/mongoIdValidation');

const assignAssessment = async (req, res) => {
    const { assessmentId } = req.query;
    const { learners } = req.body;

    try {
        if (!mongoIdVerification(assessmentId)) {
            return res.status(400).json({ message: "Invalid assessment ID." });
        }

        // 🔍 Check if all provided learner IDs are valid
        if (!Array.isArray(learners) || learners.some(id => !mongoIdVerification(id))) {
            return res.status(400).json({ message: "Invalid learner IDs provided." });
        }

        // 🔍 Check if the assessment exists
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        // 🔍 Check if the course exists
        const course = await CourseSchema.findById(assessment.courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // 🔍 Get learners from provided learner IDs
        const learnersData = await User.find(
            { _id: { $in: learners }, role: "learner" },
            { password: 0, password_org: 0 }
        );

        if (learnersData.length !== learners.length) {
            return res.status(400).json({ message: "Some learner IDs are invalid or do not exist.", status: false });
        }

        // 🔍 Ensure all learners are part of the course
        const learnersNotInCourse = learnersData.filter(learner => !learner.course_code.includes(course.course_code));
        if (learnersNotInCourse.length > 0) {
            await User.updateMany(
                { _id: { $in: learnersNotInCourse.map(l => l._id) } },
                { $addToSet: { course_code: course.course_code } }
            );
        }

        // 🔍 Get already assigned learners
        const existingAssignments = await AssignAssessment.find({
            assessmentId: assessmentId,
            userId: { $in: learnersData.map(learner => learner._id) }
        });
        const assignedUserIds = new Set(existingAssignments.map(a => a.userId.toString()));

        // 🔍 Filter learners who are NOT already assigned
        const newAssignments = learnersData
            .filter(learner => !assignedUserIds.has(learner._id.toString()))
            .map(learner => ({
                userId: learner._id,
                assessmentId: assessmentId,
                status: "pending"
            }));

        if (newAssignments.length === 0) {
            return res.status(200).json({ message: "All learners are already assigned this assessment.", status: true });
        }

        await AssignAssessment.insertMany(newAssignments);

        // 🔄 Update total_enrollment count
        await CourseSchema.findByIdAndUpdate(
            assessment.courseId,
            { $inc: { total_enrollment: newAssignments.length } } // Increment total_enrollment by the number of newly assigned learners
        );

        return res.status(201).json({ message: "Assessment assigned to new learners", assignments: newAssignments, status: true });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const reassignAssessment = async (req, res) => {
    const { userId, assessmentId } = req.body;

    try {
        if (!mongoIdVerification(userId) || !mongoIdVerification(assessmentId)) {
            return res.status(400).json({ message: "Invalid user ID or assessment ID." });
        }

        // 🔍 Check if the assignment exists
        const assignment = await AssignAssessment.findOne({ userId, assessmentId });

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found for the user.", status: false });
        }

        // 🔍 Fetch student answers
        const studentAnswers = await StudentAnswer.find({ user_id: userId });

        if (studentAnswers.length > 0) {
            // 🔄 Store previous responses in an archive collection
            await ArchivedStudentAnswer.insertMany(studentAnswers.map(ans => ({ ...ans.toObject(), archivedAt: new Date() })));

            // 🔄 Remove previous responses
            await StudentAnswer.deleteMany({ user_id: userId });
        }

        // 🔄 Update assignment status to "in_progress"
        assignment.status = "in_progress";
        await assignment.save();

        return res.status(200).json({ message: "Assessment reassigned successfully", assignment, status: true });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const removeAssignedAssessment = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoIdVerification(id)) {
            return res.status(400).json({ message: "Invalid assignment ID." });
        }

        const deletedAssignment = await AssignAssessment.findByIdAndDelete(id);
        if (!deletedAssignment) {
            return res.status(404).json({ message: "Assigned assessment not found" });
        }

        return res.status(200).json({ message: "Assigned assessment removed successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const udpateAssignedAssessment = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (!mongoIdVerification(id)) {
            return res.status(400).json({ message: "Invalid assignment ID." });
        }

        const updatedAssignment = await AssignAssessment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedAssignment) {
            return res.status(404).json({ message: "Assigned assessment not found" });
        }

        // Get Assessment and Questions
        const assessment = await Assessment.findById(updatedAssignment.assessmentId);
        const questions = await Question.find({ assessmentId: assessment._id });
        const aiModelDetail = await AIModel.findOne({ model_name: assessment.ai_model_id });
        const gradeDetails = await GradeRange.find({ grade_id: assessment.grade_id });
        const maxMark = Math.max(...gradeDetails.map(grade => grade.endRange));

        // Fetch Student Answers
        const studentAnswers = await StudentAnswer.find({
            user_id: updatedAssignment.userId,
            question_id: { $in: questions.map(q => q._id) }
        });

        // Prepare Data for AI Evaluation
        const studentQuestionDetails = studentAnswers.map(answer => {
            const question = questions.find(q => q._id.equals(answer.question_id));

            return {
                suggested_answer: Array.isArray(question?.suggested_answer)
                    ? question.suggested_answer.join(" ")
                    : (question?.suggested_answer || ""),
                question: question?.question,
                comparison_instruction: question?.comparison_instruction,
                comparison_count: question?.comparison_count,
                temperature: question?.temperature,
                student_answer: answer.student_answer?.trim() || "",
                marks: maxMark,
                provider: aiModelDetail.llm_name,
                model: aiModelDetail.model_type
            };
        }).filter(data => data.suggested_answer && data.student_answer);

        const evaluationData = {
            ...studentQuestionDetails,

        }

        // Send Data to AI for Evaluation (Assume `evaluateByAI` is an async function)
        const aiFirstEvaluations = await evaluateByAI(evaluationData,);
        const aiSecondEvaluations = await evaluateByAI(evaluationData,);
        // Update Student Answers with AI Evaluation

        const updatePromises = studentAnswers.map((answer, index) => {
            const { score: firstScore, feedback: first_score_feedback } = aiFirstEvaluations[index];
            const { score: secondScore, feedback: second_score_feedback } = aiSecondEvaluations[index];
            return StudentAnswer.findByIdAndUpdate(answer._id, {
                first_score: firstScore,
                second_score: secondScore,
                first_score_feedback,
                second_score_feedback
            }, { new: true });
        });

        await Promise.all(updatePromises);

        return res.status(200).json({
            message: "Assigned assessment updated and student answers evaluated",
            updatedAssignment
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAssignAssessmentByUserIdAndAssessmentId = async (req, res) => {
    const { userId, assessmentId } = req.query;

    try {
        if (!mongoIdVerification(userId) || !mongoIdVerification(assessmentId)) {
            return res.status(400).json({ message: "Invalid user ID or assessment ID." });
        }

        // 🔍 Check if the assessment exists
        const assessment = await Assessment.findById(assessmentId).lean();
        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        // 🔍 Check if the assignment exists
        const assignment = await AssignAssessment.findOne({ userId, assessmentId })
            .populate("userId", "name email")
            .populate("assessmentId", "title description")
            .lean();


        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        // ✅ Merge assessment details with assignment data
        const responseData = {
            ...assignment,
            assessment_name: assessment.assessment_name || assessment.title, // Use appropriate field
            assessment_type: assessment.assessment_type || "N/A", // Default if missing
        };

        return res.status(200).json(responseData);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAllAssignedAssessmentByAssessmentId = async (req, res) => {
    const { assessmentId } = req.params;

    try {
        if (!mongoIdVerification(assessmentId)) {
            return res.status(400).json({ message: "Invalid assessment ID." });
        }

        // 🔍 Check if the assessment exists
        const assessment = await Assessment.findById(assessmentId).lean();

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        // 🔍 Fetch all assignments for this assessment
        const assignments = await AssignAssessment.find({ assessmentId })
            .populate("userId", "name email")
            .lean();

        if (assignments.length === 0) {
            return res.status(404).json({ message: "No assignments found for this assessment." });
        }

        // ✅ Structure response with additional assessment details
        return res.status(200).json({
            assessmentId,
            assessment_name: assessment.assessment_name || assessment.title,
            assessment_type: assessment.assessment_type || "N/A",
            assigned_learners: assignments,
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAssignedAssessmentsByUserIdAndCourseId = async (req, res) => {
    const { userId, courseId } = req.query;

    try {
        if (!mongoIdVerification(userId) || !mongoIdVerification(courseId)) {
            return res.status(400).json({ message: "Invalid user ID or course ID." });
        }

        // 🔍 Get all assessments linked to the given courseId
        const assessments = await Assessment.find({ courseId }).lean();
        if (assessments.length === 0) {
            return res.status(404).json({ message: "No assessments found for this course." });
        }

        // 🔍 Get all assignments of the user for this course's assessments
        const assessmentIds = assessments.map(a => a._id);
        const assignments = await AssignAssessment.find({
            userId,
            assessmentId: { $in: assessmentIds }
        })
            .populate("assessmentId", "title description assessment_type")
            .lean();


        if (assignments.length === 0) {
            return res.status(404).json({ message: "No assigned assessments found for this user in this course." });
        }


        // ✅ Format response: Merge assignment details with assessment data
        const responseData = assignments.map(assignment => ({
            ...assignment,
            assessment_name: assignment.assessmentId?.title || "N/A",
            assessment_type: assignment.assessmentId?.assessment_type || "N/A"
        }));

        return res.status(200).json(responseData);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = {
    assignAssessment,
    reassignAssessment,
    removeAssignedAssessment,
    udpateAssignedAssessment,
    getAssignAssessmentByUserIdAndAssessmentId,
    getAllAssignedAssessmentByAssessmentId,
    getAssignedAssessmentsByUserIdAndCourseId
}




