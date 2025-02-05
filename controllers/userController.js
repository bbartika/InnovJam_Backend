const { default: mongoose } = require("mongoose");
const User = require("../Model/UserModel");
const crypto = require("crypto");

// Create new users (trainer or assessor)
exports.createUsers = async (req, res) => {
  try {
    const users = req.body;
    const createdUsers = [];
    for (let user of users) {
      const { email, role, name, organisation, assignedCourses, assignedAssessments } = user;

      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }


      const randomPassword = crypto.randomBytes(8).toString("hex");

      const newUser = new User({
        email,
        name,
        password: randomPassword,
        password_org: randomPassword,
        role,
        organisation,
        assignedCourses,
        assignedAssessments,
      });

      await newUser.save();

      createdUsers.push({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        password_org: newUser.password_org,
        assignedCourses: newUser.assignedCourses,
        assignedAssessments: newUser.assignedAssessments,
      });
    }

    // Return a response with the created users
    res.status(201).json({
      message: "Users created successfully",
      users: createdUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating users", error: error.message });
  }
}


// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();  // Corrected the User.find() call
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};


// Get all users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
}
