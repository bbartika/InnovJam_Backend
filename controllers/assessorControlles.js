const Course = require('../Model/CourseSchema_model');
const Assessment = require('../Model/assessment_model');
const Assigned = require('../Model/assignAssessmentSchema');
const User = require('../Model/UserModel');
const StudentAnswer = require('../Model/studentAnswer');
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




module.exports = {
    getStudentAndAssessmentDetails
}

