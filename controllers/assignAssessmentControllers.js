const AssignAssessment = require('../Model/assignAssessmentSchema');
const User = require('../Model/UserModel')
const CourseSchema = require('../Model/CourseSchema_model');
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const GradeRange = require('../Model/gradeRangeModel');
const StudentAnswer = require('../Model/studentAnswer');
const evaluationByAI = require('./evaluationByAi');
const AIModel = require('../Model/AIModel');
const ArchivedStudentAnswer = require('../Model/archivedStudentAnswerModel');
const mongoIdVerification = require('../services/mongoIdValidation');
const mongoose = require('mongoose');

const assignAssessment = async (req, res) => {
    const { assessmentId } = req.query;
    const learners = req.body;

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
                status: "pending",
                remainingTime: assessment.duration
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

        const assessment = await Assessment.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found.", status: false });
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
        assignment.status = "pending";
        assignAssessment.remainingTime = assessment.duration
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

        const assignment = await AssignAssessment.findById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Assigned assessment not found" });
        }

        // Get Assessment and Questions
        const assessment = await Assessment.findById(assignment.assessmentId);
        const questions = await Question.find({ assessmentId: assessment._id.toString() });
        const aiModelDetail = await AIModel.findById(assessment.ai_model_id.toString());
        const gradeDetails = await GradeRange.find({ grade_id: assessment.grade_id.toString() });
        const maxMark = Math.max(...gradeDetails.map(grade => grade.endRange));

        // Fetch Student Answers
        const studentAnswers = await StudentAnswer.find({
            user_id: assignment.userId,
            question_id: { $in: questions.map(q => q._id) }
        });


        if (studentAnswers.length != questions.length) {
            const updatedAssignment = await AssignAssessment.findByIdAndUpdate(
                id,
                { status: "rejected" },
                { new: true }
            );

            return res.status(404).json({ message: "No student answers found for this assessment.", status: false });
        }

        const updatedAssignedData = await AssignAssessment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );


        console.log(updatedAssignedData + " updated data ")

        // Prepare Data for AI Evaluation
        const studentQuestionDetails = studentAnswers.map(answer => {
            const question = questions.find(q => q._id.equals(answer.question_id));
            return {
                question: question?.question,
                suggested_answer: Array.isArray(question?.suggested_answer)
                    ? question.suggested_answer.join(" ")
                    : (question?.suggested_answer || ""),
                student_answer: answer.student_answer?.trim() || "",
                comparison_count: String(question?.comparison_count || "0"),
                marks: maxMark,
                temperature: parseFloat(question?.temperature || 0.0),
            };
        }).filter(data => data.suggested_answer && data.student_answer);


        // Send Data to AI for First Evaluation (Index 0)
        const aiFirstEvaluations = await evaluationByAI(studentQuestionDetails.map(data => ({
            ...data,
            model: aiModelDetail.model_type[0],
            provider: aiModelDetail.llm_name[0],
        })), aiModelDetail.llm_name[0]);

        // Send Data to AI for Second Evaluation (Index 1)
        const aiSecondEvaluations = await evaluationByAI(studentQuestionDetails.map(data => ({
            ...data,
            model: aiModelDetail.model_type[1],
            provider: aiModelDetail.llm_name[1]
        })), aiModelDetail.llm_name[1]);

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

        const data = await Promise.all(updatePromises);




        return res.status(200).json({
            message: "Assigned assessment updated and student answers evaluated",
            status: true
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
            .lean(); ``

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


const checkAllInProgressAssessments = async (req, res) => {
    try {
      // Fetch all assigned assessments with status 'in_progress'
      const inProgressAssignments = await AssignAssessment.find({
        status: "in_progress",
      });
  
      if (inProgressAssignments.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No assessments are currently in progress.",
          assessments: [],
        });
      }
  
      const currentTime = new Date();
      const updatedAssessments = [];
  
      for (const assigned of inProgressAssignments) {
        // Calculate elapsed time since last update
        const lastUpdatedTime = new Date(assigned.updatedAt);
        const elapsedTimeInSeconds = Math.floor(
          (currentTime - lastUpdatedTime) / 1000
        );
  
        // Calculate the new remaining time
        const remainingTime = Math.max(
          assigned.remainingTime - elapsedTimeInSeconds,
          0
        );
  
        if (remainingTime === 0) {
          // Time is over, check if the assessment should be completed or rejected
          await handleTimeCompletion(assigned.userId, assigned.assessmentId, assigned);
          assigned.status = "completed" || "rejected";
          assigned.remainingTime = 0;
          assigned.updatedAt = new Date();
        } else {
          // If time is still left, update remainingTime without changing status
          assigned.remainingTime = remainingTime;
        }
  
        // Add to updated list
        updatedAssessments.push({
          _id: assigned._id,
          userId: assigned.userId,
          assessmentId: assigned.assessmentId,
          status: assigned.status,
          remainingTime: assigned.remainingTime,
          updatedAt: assigned.updatedAt,
        });
  
        // Save the updated assignment
        await assigned.save();
      }
  
      return res.status(200).json({
        success: true,
        message: "In-progress assessments updated successfully.",
        assessments: updatedAssessments,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  };
  
  // Handle time completion logic
  const handleTimeCompletion = async (userId, assessmentId, assigned) => {
    const questionsCount = await Question.countDocuments({ assessmentId });
    const studentAnswersCount = await StudentAnswer.countDocuments({
      user_id: userId,
      assessment_id: assessmentId,
    });
  
    // Determine the status based on answers
    const status = studentAnswersCount === questionsCount ? "completed" : "rejected";
  
    // Update status and remainingTime in AssignAssessment
    await AssignAssessment.updateOne(
      { _id: assigned._id },
      { status, remainingTime: 0, updatedAt: new Date() }
    );
  
    console.log(
      `Assessment status updated to "${status}" for user: ${userId}`
    );
  };
  

module.exports = {
    assignAssessment,
    reassignAssessment,
    removeAssignedAssessment,
    udpateAssignedAssessment,
    getAssignAssessmentByUserIdAndAssessmentId,
    getAllAssignedAssessmentByAssessmentId,
    checkAllInProgressAssessments,
    getAssignedAssessmentsByUserIdAndCourseId
}




