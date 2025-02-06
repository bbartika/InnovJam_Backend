const Course = require('../Model/CourseSchema_model'); // Import the Course model

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { courseName,
      description, category, assessments,
      organisationName, status,
      assigned_trainers,
      assigned_learners,
      assigned_evaluators,
      resources,
      examScheduleDate

    } = req.body;

    // Create new course
    const newCourse = new Course({
      courseName,
      description,
      category,
      assessments,
      organisationName,
      status,
      assigned_trainers,
      assigned_learners,
      assigned_evaluators,
      resources,
      examScheduleDate
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Fetch all courses details
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find(); // Just fetch all courses without populating any fields
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};


// Fetch a single course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};




// Edit existing course assessment details
exports.editAssessment = async (req, res) => {
  try {
    const { courseId, assessmentId, name, description, weightage } = req.body;

    // Find course and update assessment
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: courseId, 'assessments._id': assessmentId },
      {
        $set: {
          'assessments.$.name': name,
          'assessments.$.description': description,
          'assessments.$.weightage': weightage,
        }
      },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course or assessment not found' });
    }

    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

// Delete an existing course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Delete the course
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
