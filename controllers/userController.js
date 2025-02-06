const User = require("../Model/UserModel");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, course_code } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    if ((role !== 'super_admin' || role !== 'admin') && !course_code) {
      return res.status(400).json({ message: "Please provide course code." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (role === 'super_admin') {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (!['admin', 'learner', 'assessor', 'trainer'].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      password_org: password,
      role,
      course_code
    });


    await newUser.save();

    res.status(201).json({
      message: "User created successfully!",
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const createUsers = async (req, res) => {
  try {
    const users = req.body;

    console.log(req.body)

    // Validate if users array is provided
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "Please provide a valid array of users." });
    }

    // Arrays to track created users and errors
    const createdUsers = [];
    const failedUsers = [];

    // Process each user in the array
    for (const user of users) {
      try {
        const { name, email, password, role, course_code } = user;

        // Validate required fields for each user
        if (!name || !email || !password || !role) {
          throw new Error("Please provide all required fields.");
        }

        if ((role !== 'super_admin' || role !== 'admin') && !course_code) {
          throw new Error("Please provide course code.");
        }

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        if (!email.includes("@")) {
          throw new Error("Invalid email format.");
        }

        if (role === 'super_admin') {
          throw new Error("Invalid role.");
        }

        if (!['admin', 'learner', 'assessor', 'trainer'].includes(role)) {
          throw new Error("Invalid role.");
        }

        // Check if the email already exists for each user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error(`Email ${email} is already in use.`);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance for each user
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          password_org: password,
          role,
          course_code
        });

        // Save the user
        await newUser.save();

        // Add to the created users array
        createdUsers.push({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        });

      } catch (error) {
        // If error occurs, add the user to failedUsers with the error message
        failedUsers.push({
          user: user,
          error: error.message
        });
      }
    }

    // Respond with both the created and failed users
    res.status(201).json({
      message: "Bulk user creation process completed.",
      successCount: createdUsers.length,
      failedCount: failedUsers.length,
      createdUsers,
      failedUsers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

const getUsersByRole = async (req, res) => {
  const { role } = req.params;
  try {
    const users = await User.find({ role });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }

}

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, course_code } = req.body;

  try {
    // Validate the fields provided
    if (!name || !role || !course_code) {
      return res.status(400).json({ message: "Name, role, and course_code are required." });
    }

    // If the password is provided, validate its length
    if (password && password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // If email is provided, validate its format and uniqueness
    if (email) {
      if (!email.includes("@")) {
        return res.status(400).json({ message: "Invalid email format." });
      }

      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail && existingUserWithEmail._id.toString() !== id) {
        return res.status(400).json({ message: "Email is already in use by another user." });
      }
    }

    // If the password is being updated, hash it
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create an object to hold the update fields (only the ones provided)
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (password) updateFields.password = hashedPassword;
    if (role) updateFields.role = role;
    if (course_code) updateFields.course_code = course_code;

    // Find the user by ID and update the fields
    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully!",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        course_code: updatedUser.course_code,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const removeUser = async (req, res) => { };

const getAllUsersByRole = async (req, res) => { }

module.exports = {
  createUsers,
  createUser,
  getUsersByRole,
  updateUser,
  removeUser,
  getAllUsersByRole
}

