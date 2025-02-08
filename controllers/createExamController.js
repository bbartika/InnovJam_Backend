const axios = require("axios");
const FormData = require("form-data");
const File = require("../Model/file");
const Assessment = require("../Model/assessment_model");
const Question = require('../Model/QuestionModel');
const mongoIdVerification = require('../services/mongoIdValidation')


// const uploadToAiApi = async (content) => {
//   try {
//     console.log("Sending data to AI...");
//     const formData = new FormData();
//     formData.append("content", content);

//     const response = await axios.post(`${process.env.AI_SERVER_URL}/extract/`, formData);
//     console.log("Response from AI API received:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Error sending file to AI API:", error);
//     throw new Error("AI processing failed.");
//   }
// };

// exports.createExam = async (req, res) => {

//   const {
//     course_id,
//     course_name,
//     assessmentName,
//     fileId
//   } = req.body;


//   if (!course_id || !course_name) {
//     return res.status(400).json({
//       success: false,
//       message: "Missing course_id or course_name",
//     });
//   }

//   try {


//     const file = await File.findById(fileId);

//     if (!file) {
//       return res.status(404).json({ error: "File not found" });
//     }

//     // Process file with AI and save results
//     const aiResponse = await uploadToAiApi(file.content);
//     console.log("AI response:", aiResponse);

//     const {
//       assessment_type,
//       case_study_context,
//       questions_and_answers
//     } = aiResponse;

//     const enrichedQuestions = questions_and_answers?.map((question) => ({
//       ...question,
//       student_answer: "",
//       sbert_score: null,
//       roberta_score: null,
//       distilroberta_score: null,
//       t5_score: null,
//       use_score: null,
//       gpt_score: null,
//       minilm_score: null,
//       labse_score: null,
//       gemini_score: null,
//       longformer_score: null,
//       feedback: "",
//       human_assess_remarks: null,
//       isCompetent: false,
//     }));

//     const newAssessment = new Assessment({
//       assessment_name: assessmentName,
//       assessment_type,
//       case_study_context,
//       courseId: course_id,
//       course_name: course_name,
//       data: enrichedQuestions,
//     });

//     console.log("New assessment created:", newAssessment);

//     await newAssessment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Exam created successfully",
//       assessment: newAssessment,
//     });
//   } catch (error) {
//     console.error("Error during exam creation:", error);
//   }
// };

const uploadToAiApi = async (content) => {
  try {
    const formData = new FormData();
    formData.append("content", content);

    const response = await axios.post(`${process.env.AI_SERVER_URL}/extract/`, formData);
    return response.data;
  } catch (error) {
    console.error("Error sending file to AI API:", error);
    throw new Error("AI processing failed.");
  }
};

const createAssessment = async (req, res) => {
  const { course_id, assessment_name, fileId } = req.body;

  try {
    if (!mongoIdVerification(course_id)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    if (!mongoIdVerification(fileId)) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    if (!assessment_name) {
      return res.status(400).json({ message: "Assessment name is required." });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Process file with AI and get structured questions
    const aiResponse = await uploadToAiApi(file.content);
    const { assessment_type, case_study_context, assessment_instruction, questions_and_answers, duration } = aiResponse;


    // 🔍 Check if an assessment with the same `course_id` and `fileId` already exists
    let existingAssessment = await Assessment.findOne({ courseId: course_id, assessment_file_id: fileId });

    if (existingAssessment) {
      // 🗑️ Delete existing questions linked to this assessment
      await Question.deleteMany({ assessmentId: existingAssessment._id });

      // ✏️ Update existing assessment
      existingAssessment.assessment_name = assessment_name;
      existingAssessment.assessment_type = assessment_type;
      existingAssessment.case_study_context = case_study_context;
      existingAssessment.duration = duration || "";
      existingAssessment.assessment_instruction = assessment_instruction || [];

      await existingAssessment.save();
    } else {
      // 🆕 Create a new assessment if not found
      existingAssessment = new Assessment({
        assessment_name,
        assessment_type,
        case_study_context,
        duration: duration || "",
        assessment_instruction: assessment_instruction || [],
        courseId: course_id,
        assessment_file_id: fileId
      });

      await existingAssessment.save();
    }

    // 🔄 Insert updated questions into the `Question` collection
    const questionDocuments = questions_and_answers.map((q) => ({
      assessmentId: existingAssessment._id,
      question_number: q.question_number,
      question: q.question,
      question_instruction: q.question_instruction || "",
      suggested_answer: q.suggested_answer || []
    }));

    await Question.insertMany(questionDocuments);

    return res.status(200).json({
      success: true,
      message: "Exam assessment updated successfully",
    });

  } catch (error) {
    console.error("Error during exam creation:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
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

const updateAssessment = async (req, res) => { };

module.exports = {
  removeAssessment,
  getQuestionsBasedOnAssessmentId,
  getAllAssessments,
  uploadToAiApi,
  createAssessment
}