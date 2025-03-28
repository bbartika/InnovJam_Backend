const axios = require("axios");
const FormData = require("form-data");
const File = require("../Model/file");
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const AssignAssessment = require('../Model/assignAssessmentSchema');
const Grade = require('../Model/gradeModel');
const StudentAnswer = require('../Model/studentAnswer');
const CourseSchema = require('../Model/CourseSchema_model');
const AiModel = require('../Model/AIModel');
const Course = require("../Model/CourseSchema_model");
const mongoose = require("mongoose");
const mongoIdVerification = require('../services/mongoIdValidation');

const uploadToAiApi = async (content, retries = 3) => {
  const formData = new FormData();
  formData.append("content", content);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Sending request to AI API...`);
      const response = await axios.post(
        `${process.env.AI_SERVER_URL}/extract/`,
        formData,
        { timeout: 600000 }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message || error);
      if (attempt === retries) return { error: "AI API request failed after retries." };
    }
  }
};

const createAssessment = async (req, res) => {
  const { course_id, assessment_name, fileId, grade_id, ai_model_id } = req.body;
  try {

    if (!mongoIdVerification(course_id) || !mongoIdVerification(grade_id) || !mongoIdVerification(ai_model_id)) {
      return res.status(400).json({ message: "Invalid course ID or grade ID or AI model ID." });
    }

    if (!mongoIdVerification(fileId)) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    if (!assessment_name) {
      return res.status(400).json({ message: "Assessment name is required." });
    }
    // 🔍 Check if the course exists

    const course = await CourseSchema.findById(course_id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const grade = await Grade.findById(grade_id);

    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const aiModel = await AiModel.findById(ai_model_id);
    if (!aiModel) {
      return res.status(404).json({ error: "AI model not found" });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // 🔄 Process file with AI
    const aiResponse = await uploadToAiApi(file.content);

    // 🛑 If AI API fails, return a safe error response
    if (aiResponse.error) {
      return res.status(500).json({ success: false, message: aiResponse.error });
    }

    const { assessment_type, case_study_context, assessment_instruction, questions_and_answers, duration , Suggested_answer_points_count } = aiResponse;

    if (!assessment_type || !assessment_instruction || !questions_and_answers) {
      return res.status(400).json({ success: false, message: "Invalid AI response. Please try again." });
    }

    // 🔍 Check if an assessment already exists
    let existingAssessment = await Assessment.findOne({ courseId: course_id, assessment_file_id: fileId });

    if (existingAssessment) {
      await Question.deleteMany({ assessmentId: existingAssessment._id });

      existingAssessment.assessment_name = assessment_name;
      existingAssessment.assessment_type = assessment_type;
      existingAssessment.case_study_context = case_study_context;
      existingAssessment.duration = duration || "";
      existingAssessment.grade_id = grade_id;
      existingAssessment.ai_model_id = ai_model_id;
      existingAssessment.assessment_instruction = assessment_instruction || [];

      await existingAssessment.save();
    } else {
      existingAssessment = new Assessment({
        assessment_name,
        assessment_type,
        case_study_context,
        duration: duration || "",
        grade_id: grade_id,
        ai_model_id: ai_model_id,
        assessment_instruction: assessment_instruction || [],
        courseId: course_id,
        assessment_file_id: fileId,
      });

      await existingAssessment.save();
    }

    // 🔄 Insert new questions
    const questionDocuments = questions_and_answers.map((q) => ({
      assessmentId: existingAssessment._id,
      question_number: q.question_number,
      question: q.question,
      question_instruction: q.question_instruction || "",
      suggested_answer: q.suggested_answer || [],
      comparison_instruction: q.comparison_instruction || "",
      comparison_count: q.comparison_count || 0,
      Suggested_answer_points_count: q.Suggested_answer_points_count
    }));

    await Question.insertMany(questionDocuments);

    return res.status(200).json({
      success: true,
      message: "Exam assessment updated successfully",
    });

  } catch (error) {
    console.error("🚨 Unexpected Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

const getAllAssessments = async (req, res) => {
  const { course_id } = req.params;
  try {
    if (!mongoIdVerification(course_id)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const assessments = await Assessment.find({ courseId: course_id });


    return res.status(200).json(assessments);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getAssessmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const assessment = await Assessment.findById(id);
   
    return res.status(200).json(assessment);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

const getQuestionsBasedOnAssessmentId = async (req, res) => {
  const { id } = req.params;
  try {
    const questions = await Question.find({ assessmentId: id });
    return res.status(200).json(questions);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

const removeAssessment = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoIdVerification(id)) {
      return res.status(400).json({ message: "Invalid assessment ID." });
    }

    // 🔍 Check if the assessment exists
    const assessment = await Assessment.findById(id);
    // Handle errors and return an error response
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    const assinedAssessment = await AssignAssessment.findOne({ assessmentId: id });

    if (assinedAssessment) {
      return res.status(400).json({ message: "Cannot delete an assessment with associated assignments" });
    }

    // 🗑️ Delete all questions linked to this assessment
    await Question.deleteMany({ assessmentId: id });

    // 🗑️ Delete the assessment
    await Assessment.findByIdAndDelete(id);

    return res.status(200).json({ message: "Assessment and related questions deleted successfully" });

  } catch (error) {
    console.error("Error deleting assessment:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getQuestionsForAssessment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    if (!mongoIdVerification(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    const assigned = await AssignAssessment.findOne({ userId, assessmentId: id });

    // Fetch questions without `suggested_answer`
    const questions = await Question.find({ assessmentId: id })
      .select("-suggested_answer -comparison_count -temperature")
      .lean();

    const questionIds = questions.map(q => q._id);

    // Fetch student answers for the given user and assessment questions
    const studentAnswers = await StudentAnswer.find({
      user_id: userId,
      question_id: { $in: questionIds }
    }).select("question_id status"); // Only fetch `status` field

    // Create a Map for quick lookup of student answer statuses
    const statusMap = new Map(studentAnswers.map(sa => [sa.question_id.toString(), sa.status]));

    // Attach status to each question while keeping `suggested_answer` excluded
    const questionsWithStatus = questions.map(q => ({
      ...q,
      status: statusMap.get(q._id.toString()) || 0 // Default to 0 if not found
    }));

    const assessmentdata = {
      ...assessment.toObject(),
      questions: questionsWithStatus
    };

    return res.status(200).json({
      success: true,
      assigned,
      assessmentdata
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
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

  // Update the status and remainingTime in AssignAssessment
  await AssignAssessment.updateOne(
    { _id: assigned._id },
    { status, remainingTime: 0 }
  );

  console.log(`Assessment status updated to "${status}" for user: ${userId}`);
};


const updateQuestion_Temperature = async (req, res) => {
  const questions = req.body;

  try {
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Invalid input format", status: false });
    }

    // Validate all question IDs and temperature fields
    for (const q of questions) {
      if (!mongoose.Types.ObjectId.isValid(q.question_id) || q.temperature === undefined) {
        return res.status(400).json({ message: "Invalid question ID or missing temperature", status: false });
      }
    }

    // Convert question_id to ObjectId for MongoDB query
    const questionIds = questions.map(q => new mongoose.Types.ObjectId(q.question_id));

    // Check if all questions exist
    const existingQuestions = await Question.find({ _id: { $in: questionIds } });

    if (existingQuestions.length !== questions.length) {
      return res.status(404).json({ message: "Some questions not found", status: false });
    }

    // Perform bulk update
    const bulkOperations = questions.map(q => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(q.question_id) },
        update: { $set: { temperature: q.temperature } }
      }
    }));

    await Question.bulkWrite(bulkOperations);

    return res.status(200).json({ message: "All questions updated successfully", status: true });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



module.exports = {
  removeAssessment,
  getQuestionsBasedOnAssessmentId,
  getAllAssessments,
  uploadToAiApi,
  createAssessment,
  getAssessmentById,
  getQuestionsForAssessment,
  updateQuestion_Temperature
}