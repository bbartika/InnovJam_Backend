const express = require("express");
const router = express.Router();
const Assessment = require("../Model/assessment_model"); // Import the Assessment model
const assessmentController = require("../controllers/assessmentController");
const { updateFinalEvaluatedData } = require('../controllers/assessmentController');
const Assessments = require("../Model/assessment_model"); // Import your model

// Route to fetch all assessments
router.get("/", async (req, res) => {
  try {
    const assessments = await Assessment.find(); // Fetch all assessments
    res.status(200).json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching assessments", error: error.message });
  }
});

// Route to fetch a specific assessment by ID
//----------------------------------------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const assessment = await Assessment.findById(id); // Fetch assessment by ID

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.status(200).json(assessment);
  } catch (error) {
    console.error(`Error fetching assessment with ID ${id}:`, error.message);
    res
      .status(500)
      .json({ message: "Error fetching assessment", error: error.message });
  }
});


// Get all assessments for a given courseId
//------------------------------------------

router.get("/all/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find assessments that match the given courseId
    const assessments = await Assessment.find({ courseId });

    if (!assessments.length) {
      return res.status(404).json({ message: "No assessments found for this course." });
    }

    res.status(200).json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Route to save student's answer for a specific question
router.put(
  "/:assessmentId/questions/:questionId",
  assessmentController.updateStudentAnswer
);


//define the route to update assessment data
router.put('/update-assessment', updateFinalEvaluatedData);

module.exports = router;
