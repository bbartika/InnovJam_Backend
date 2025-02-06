const mongoose = require("mongoose");
const { nanoid } = require("nanoid"); // For generating unique slugs

const CourseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      default: () => nanoid(10),
    },
    description: {
      type: String,
      trim: true,
      default: "No description provided.",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    assessments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
        },
        weightage: {
          type: Number,
          default: 0,
        },
      },
    ],

    gradingSystem: {
      type: [
        {
          grade: { type: String },
          minPercentage: { type: Number },
          maxPercentage: { type: Number },
        },
      ],
      default: [],
    },

    assigned_trainers: {
      type: [String],
      default: []
    },
    assigned_learners: {
      type: [String],
      default: []
    },
    assigned_evaluators: {
      type: [String],
      default: []
    },

    uploaded_courseware: [
      {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
        filename: { type: String },
        url: { type: String, trim: true },
      },
    ],
    resources: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],

    organisationName: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: [
        "In Creation",
        "Ongoing",
        "Review Pending",
        "Completed",
        "Results Out",
      ],
      default: "In Creation",
    },
    visibility: {
      type: String,
      enum: ["Private", "Public"],
      default: "Private",
    },
    tags: { 
      type: [String],
      default: [],
    },

    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },

    competent_learners: {
      type: [String], // Array of learner emails marked as competent
      default: []
    },
    total_enrollment_count: {
      type: Number, // Total number of enrolled learners
      default: 0
    },
    submission_completed: {
      type: [String], // Array of learner emails who completed submissions
      default: []
    },
    examScheduleDate: {
      type: Date, // Date for scheduling exams
      default: null
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
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save middleware to update the slug if the course name changes
CourseSchema.pre("save", function (next) {
  if (this.isModified("courseName")) {
    this.slug = `${this.courseName.toLowerCase().replace(/[\s]+/g, "-")}-${nanoid(5)}`;
  }
  next();
});

module.exports = mongoose.model("Course", CourseSchema);
