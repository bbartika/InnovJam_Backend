//Controller that will handle the logic of saving the student's answer.

// controllers/assessmentController.js
const Assessment = require("../Model/assessment_model"); // Adjust path if needed

// Function to update student's answer for a question
const updateStudentAnswer = async (req, res) => {
  try {
    const { assessmentId, questionId } = req.params;
    const { student_answer } = req.body;

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

     // Find the question index in the data array
     const questionIndex = assessment.data.findIndex(q => q._id.toString() === questionId);

     if (questionIndex === -1) {
       return res.status(404).json({ message: "Question not found" });
     }
 
     // Update the student's answer
     assessment.data[questionIndex].student_answer = student_answer;

    // Save the updated assessment
    await assessment.save();

    return res.status(200).json({ message: "Answer saved successfully!" });
  
} catch (error) {

    console.error("Error updating the answer:", error);
    return res.status(500).json({ message: "Failed to save the answer" });
  
}};

//update final evaluated data in database
const updateFinalEvaluatedData = async (req, res) => {

  const { assessmentId , newData } = req.body;

  if(!assessmentId || !newData) {
    return res.status(400).json({ message: "Missing assessmentId or newData" });
  }

  try {
    // Find the assessment by ID
    const updatedAssessment  = await Assessment.findByIdAndUpdate(
      assessmentId,
      {data:newData},
      { new: true }//return the updated document
    );

    if (!updatedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    console.log("Updated Assessment:");

    return res.status(200).json({
      message: "Final evaluated data updated successfully!",
      updatedAssessment, // Optional: Include updated assessment in response
    });
} catch (error) {

    console.error("Error updating the final evaluated data:", error);
    return res.status(500).json({ message: "Failed to save the final evaluated data" });
  
}};

module.exports = {
  updateStudentAnswer,
  updateFinalEvaluatedData 
};
