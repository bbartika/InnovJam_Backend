const CourseSchema = require('../Model/CourseSchema_model');
const User = require('../Model/UserModel')
const mongoIdVerification = require('../services/mongoIdValidation')

const createCourse = async (req, res) => {
  const { course_name, course_code, description, visibility, startDate, endDate } = req.body;
  try {

    if (!course_name || !course_code || !visibility || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields except description are required." });
    }

    // Check if course_code is already taken
    const existingCourse = await CourseSchema.findOne({ course_code });
    if (existingCourse) {
      return res.status(400).json({ message: "Course code must be unique." });
    }

    // Create new course
    const newCourse = new CourseSchema({
      course_name,
      course_code,
      description,
      visibility,
      total_enrollment : 0,
      startDate,
      endDate,
    });

    await newCourse.save();
    return res.status(201).json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {

    const courses = await CourseSchema.find();
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getCoursesByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoIdVerification(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userDetails.role === "super_admin" || userDetails.role === "admin") {
      const courses = await CourseSchema.find();
      return res.status(200).json(courses);
    }

    // Extract array of course codes
    const courseCodes = userDetails.course_code;

    // Find courses where course_code matches any in the user's course_code array
    const courses = await CourseSchema.find({ course_code: { $in: courseCodes } });

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await CourseSchema.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const { course_name, course_code, description, total_enrollment, visibility, startDate, endDate } = req.body;

    if (!course_name || !course_code || !visibility || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields except description are required." });
    }

    // Check if course_code is already taken by another course
    if (course_code) {
      const existingCourse = await CourseSchema.findOne({ course_code, _id: { $ne: req.params.id } });
      if (existingCourse) {
        return res.status(400).json({ message: "Course code must be unique." });
      }
    }

    const updatedCourse = await CourseSchema.findByIdAndUpdate(
      req.params.id,
      { course_name, course_code, description, total_enrollment, visibility, startDate, endDate, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await CourseSchema.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByUserId,
};
