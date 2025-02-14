const axios = require("axios");
const FormData = require("form-data");
const File = require("../Model/file");
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const AssignAssessment = require('../Model/assignAssessmentSchema');
const Grade = require('../Model/gradeModel');
const AiModel = require('../Model/AIModel');
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
      console.log("Response from AI API received:", response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message || error);
      if (attempt === retries) return { error: "AI API request failed after retries." };
    }
  }
};

const createAssessment = async (req, res) => {
  try {
    const { course_id, assessment_name, fileId, grade_id, ai_model_id } = req.body;

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

    const { assessment_type, case_study_context, assessment_instruction, questions_and_answers, duration } = aiResponse;

    if (!assessment_type || !case_study_context || !assessment_instruction || !questions_and_answers) {
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
      comparison_count: q.comparison_count || 0
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
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
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
  const { userId } = req.query

  try {

    if (!mongoIdVerification(userId)) {
      return res.status(400).json({ message: "Invalid  user ID." });
    }

    const assessment = await Assessment.findById(id)

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    const assigned = await AssignAssessment.findOne({ userId, assessmentId: id })

    const questions = await Question.find({ assessmentId: id }).select("-suggested_answer");

    const assessmentdata = {
      ...assessment.toObject(),
      questions,
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

const updateQuestion_Temparature = async (req, res) => {
  const { id } = req.params;
  const { temparature } = req.body;
  try {
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: "Question not found", status: false });
    }

    question.temparature = temparature
    await question.save();

    return res.status(200).json({ message: "Question updated successfully", status: true });
  }
  catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}


module.exports = {
  removeAssessment,
  getQuestionsBasedOnAssessmentId,
  getAllAssessments,
  uploadToAiApi,
  createAssessment,
  getAssessmentById,
  getQuestionsForAssessment,
  updateQuestion_Temparature
}