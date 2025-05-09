const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    course_name: {
      type: String,
      required: true,
      trim: true,
    },
    course_code: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null,
    },
    isAvailableLiveAssessment: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      default: "Public",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    total_enrollment: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CourseSchema", CourseSchema);
