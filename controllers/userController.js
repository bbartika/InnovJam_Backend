const User = require("../Model/UserModel");
const Course = require("../Model/CourseSchema_model");
const Assigned = require("../Model/assignAssessmentSchema");
const Assessment = require("../Model/assessment_model");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, course_code } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    if ((role !== "super_admin" || role !== "admin") && !course_code) {
      return res.status(400).json({ message: "Please provide course code." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // if (role === 'super_admin') {
    //   return res.status(400).json({ message: "Invalid role." });
    // }

    if (!["super_admin", "admin", "learner", "assessor"].includes(role)) {
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
      password_org: hashedPassword,
      role,
      course_code,
    });

    if (role === "learner") {
      const course = await Course.findOne({ course_code: course_code });
      course.total_enrollment += 1;
      await course.save();
    }

    await newUser.save();

    res.status(201).json({
      message: "User created successfully!",
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const createUsers = async (req, res) => {
  try {
    const users = req.body;

    // Validate if users array is provided
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid array of users." });
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

        if ((role !== "super_admin" || role !== "admin") && !course_code) {
          throw new Error("Please provide course code.");
        }

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        if (!email.includes("@")) {
          throw new Error("Invalid email format.");
        }

        // if (role === 'super_admin') {
        //   throw new Error("Invalid role.");
        // }

        if (!["super_admin", "admin", "learner", "assessor"].includes(role)) {
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
          course_code,
        });

        if (role === "learner") {
          const course = await Course.findOne({ course_code: course_code });
          course.total_enrollment += 1;
          await course.save();
        }

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
          error: error.message,
        });
      }
    }

    if (createdUsers.length === 0) {
      return res.status(400).json({
        message: "All users failed to be created.",
        failedUsers,
      });
    }

    // Respond with both the created and failed users
    res.status(201).json({
      message: "Bulk user creation process completed.",
      successCount: createdUsers.length,
      failedCount: failedUsers.length,
      createdUsers,
      failedUsers,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
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
};

const updateUser = async (req, res) => {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
  const { id } = req.params;
  const { name, email, password, role, course_code } = req.body;

  try {
    // ✅ Fetch User
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Validate Role
    if (
      role &&
      !["super_admin", "admin", "learner", "assessor"].includes(role)
    ) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // ✅ Ensure Course Code is Required for Non-Admins
    if (role && role !== "admin" && role !== "super_admin" && !course_code) {
      return res.status(400).json({ message: "Please provide course code." });
    }

    // ✅ Validate Email Uniqueness
    if (email) {
      if (!email.includes("@")) {
        return res.status(400).json({ message: "Invalid email format." });
      }

      const existingUserWithEmail = await User.findOne({ email });
      if (
        existingUserWithEmail &&
        existingUserWithEmail._id.toString() !== id
      ) {
        return res
          .status(400)
          .json({ message: "Email is already in use by another user." });
      }
    }

    // ✅ Validate Password (if updating)
    let hashedPassword = existingUser.password;
    if (password) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long." });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ✅ Update Enrollment Count if Role Changes to/from Learner
    if (role && role === "learner" && existingUser.role !== "learner") {
      const course = await Course.findOne({ course_code });
      if (course) {
        course.total_enrollment += 1;
        await course.save();
      }
    } else if (role && existingUser.role === "learner" && role !== "learner") {
      const course = await Course.findOne({
        course_code: existingUser.course_code,
      });
      if (course) {
        course.total_enrollment -= 1;
        await course.save();
      }
    }

    // ✅ Prepare Update Fields
    const updateFields = {
      ...(name && { name }),
      ...(email && { email }),
      ...(password && { password: hashedPassword }),
      ...(role && { role }),
      ...(course_code && { course_code }),
    };

    // ✅ Update User
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    return res.status(200).json({
      message: "User updated successfully!",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        course_code: updatedUser.course_code,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// const assignCourseToUser = async (req, res) => {
//   const { id } = req.params;
//   const { course_code } = req.body;

//   try {
//     // ✅ Fetch User
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found.", status: false });
//     }

//     if (!course_code) {
//       return res.status(400).json({ message: "Please provide course code.", status: false});
//     }

//     //find previously assigned course codes of this user
//     const previousCourseCodes = user.course_code || [];
//     console.log("previous",previousCourseCodes);

//     const previousCourses = await Course.find({ course_code: { $in: previousCourseCodes }});
//     // ✅ Validate Course Codes
//     const validCourses = await Course.find({ course_code: { $in: course_code } });
//     const validCourseCodes = validCourses.map(course => course.course_code);
//     console.log("valid",validCourseCodes);
    
//     if (validCourseCodes.length === 0) {
//       return res.status(404).json({ message: "No valid courses found.", status: false });
//     }
//     const addedCourseCodes = [];
    
//     for (const course of previousCourses) {  
//       //Find all live assessments of this course
//       const live_assessments = await Assessment.find({ courseId: course._id, isLive: true });
      
//       //iterate over live assessments and find if any of them is assigned to this user
//       for (const assessment of live_assessments) {
//         //find if user is assigned to any of the live assessments of this course
//         const assignedAssessment = await Assigned.findOne({ assessmentId: assessment._id, userId: id });
        
//         if (assignedAssessment) {
//           // user.course_code = course.course_code;
//           addedCourseCodes.push(course.course_code);
          
//           // await user.save()
//         }
//       }
//     }
//     console.log("added",addedCourseCodes);
    
//     //which are not in added but are in validateCourseCodes
//     const newCourseCodes = validCourseCodes.filter(code => !addedCourseCodes.includes(code));
//     console.log("new", newCourseCodes); 

//     // ✅ Replace existing courses with new ones
//     user.course_code = [...new Set([...addedCourseCodes, ...newCourseCodes])];
//     await user.save();

//     return res.status(200).json({
//       message: "Courses updated for user successfully!",
//       status: true,
//       // assignedCourses: validCourseCodes
//       addedCourses: addedCourseCodes,
//       newCourses: newCourseCodes,
//       allFinalCourses: user.course_code
//     });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal server error.", error: error.message });
//   }
// };
    //find course codes which are not in validCourseCodes but were in previousCourseCodes
    // const oldCourseCodes = previousCourseCodes.filter(code => !validCourseCodes.includes(code));
    // //if there is any invalid course code, then check if there is any live assessment available for that course
    // const oldCourses = await Course.find({ course_code: { $in: oldCourseCodes } });
    // console.log(oldCourses);

    // if(oldCourses.length === 0){
    //   user.course_code = validCourseCodes;
    //   await user.save();
    //   return res.status(200).json({
    //     message: "Courses updated for user successfully!",
    //     status: true,
    //     assignedCourses: validCourseCodes
    //   });
    // }
    
    //find cours codes which are not in previousCourseCodes but are in validCourseCodes
    // const newCourseCodes = validCourseCodes.filter(code => !previousCourseCodes.includes(code));
    // console.log(newCourseCodes);

    // if(newCourseCodes.length === 0) {
    //   user.course_code = validCourseCodes;
    //   await user.save();
    //   return res.status(200).json({
    //     message: "Courses updated for user successfully!",
    //     status: true,
    //     assignedCourses: validCourseCodes
    //   });
    // }
    
    // ✅ Check if there is any available live assessment for the invalid courses
    
        
      
      // if (course.isAvailableLiveAssessment) {
      //   //check user is assigned to this live assessment of this course or not keep in mind one thing one course have multiple assessment and from multiple assessments some assessment can be live and some can not be
      //   const assignedAssessments = await Assigned.findOne({ courseId: course._id, userId: id });
      //   //iterates over the assignedassessments and check if any of them is live
      //   for (const assessment of assignedAssessments) {
      //     const assessmentDetails = await Assessment.findById(assessment.assessmentId);
      //     if (assessmentDetails.isLive) {
      //       return res.status(400).json({ message: `Course ${course.course_code} has an available live assessment.`, status: false });
      //     }
      //   }
      

// const assignCourseToUser = async (req, res) => {
//   const { id } = req.params;
//   const { course_code } = req.body;

//   try {
//     // ✅ Fetch User
//     const user = await User.findById(id);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "User not found.", status: false });
//     }

//     if (!course_code) {
//       return res
//         .status(400)
//         .json({ message: "Please provide course code.", status: false });
//     }

//     // ✅ Validate Course Codes
//     const validCourses = await Course.find({
//       course_code: { $in: course_code },
//     });

//     const validCourseCodes = validCourses.map((course) => course.course_code);

//     if (validCourseCodes.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No valid courses found.", status: false });
//     }

//     return res.status(200).json({
//       message: "Courses updated for user successfully!",
//       status: true,
//       assignedCourses: validCourseCodes,
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Internal server error.", error: error.message });
//   }
// };

const assignCourseToUser = async (req, res) => {
  const { id } = req.params; // User ID from request parameters
  const { course_code } = req.body; // Course codes from request body

  try {
    // ✅ Fetch User
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found.", status: false });
    }

    if (!course_code || !Array.isArray(course_code)) {
      return res.status(400).json({ message: "Please provide valid course codes.", status: false });
    }

    // Fetch previously assigned course codes for the user
    const previousCourseCodes = user.course_code || [];
    console.log("Previous Course Codes:", previousCourseCodes);

    // Fetch courses corresponding to the previous course codes
    const previousCourses = await Course.find({ course_code: { $in: previousCourseCodes } });

    // ✅ Validate Course Codes
    const validCourses = await Course.find({ course_code: { $in: course_code } });
    const validCourseCodes = validCourses.map(course => course.course_code);
    console.log("Valid Course Codes:", validCourseCodes);

    if (validCourseCodes.length === 0) {
      return res.status(404).json({ message: "No valid courses found.", status: false });
    }

    const addedCourseCodes = []; // Courses that cannot be removed due to live assessments

    for (const course of previousCourses) {
      // Find all live assessments of this course
      const liveAssessments = await Assessment.find({ courseId: course._id, isLive: true });

      for (const assessment of liveAssessments) {
        // Check if the user is assigned to any live assessments of this course
        const assignedAssessment = await Assigned.findOne({
          assessmentId: assessment._id,
          userId: id,
        });

        if (assignedAssessment) {
          // If the user is assigned to a live assessment, prevent removal of this course
          addedCourseCodes.push(course.course_code);
        }
      }
    }
    console.log("Added Course Codes:", addedCourseCodes);

    // Filter out new courses that can be safely added
    const newCourseCodes = validCourseCodes.filter(code => !addedCourseCodes.includes(code));
    console.log("New Course Codes:", newCourseCodes);

    // ✅ Update user's courses by merging existing and new courses
    user.course_code = [...new Set([...addedCourseCodes, ...newCourseCodes])];
    await user.save();

    return res.status(200).json({
      message: "Courses updated for user successfully!",
      status: true,
      addedCourses: addedCourseCodes,
      newCourses: newCourseCodes,
      allFinalCourses: user.course_code,
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

const removeUser = async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Fetch User First (Before Deleting)
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Prevent Super Admin from Being Deleted
    if (user.role === "super_admin") {
      return res
        .status(400)
        .json({ message: "Super admin cannot be deleted." });
    }

    const assignedAssessment = await Assigned.findOne({ userId: id });

    if (assignedAssessment) {
      return res
        .status(400)
        .json({ message: "User is currently assigned to an assessment." });
    }

    // ✅ Update Course Enrollment if User is a Learner
    if (user.role === "learner" && user.course_code) {
      const course = await Course.findOne({ course_code: user.course_code });
      if (course) {
        course.total_enrollment -= 1;
        await course.save();
      }
    }

    // ✅ Delete User
    await User.findByIdAndDelete(id);

    return res.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getUserDetailsById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // Query the database for all users
    const users = await User.find({}, { password: 0, password_org: 0 },);

     

    // for (const course of previousCourses) {
    //   // Find all live assessments of this course
    //   const liveAssessments = await Assessment.find({ courseId: course._id, isLive: true });

    //   for (const assessment of liveAssessments) {
    //     // Check if the user is assigned to any live assessments of this course
    //     const assignedAssessment = await Assigned.findOne({
    //       assessmentId: assessment._id,
    //       userId: id,
    //     });

    //     if (assignedAssessment) {
    //       // If the user is assigned to a live assessment, prevent removal of this course
    //       addedCourseCodes.push(course.course_code);
    //     }
    //   }
    // }
    // console.log("Added Course Codes:", addedCourseCodes);

    //  const liveAssessments = await Assessment.find({ courseId: course._id, isLive: true});

    // Arrays to hold users by their roles
    const superadmin = [];
    const admins = [];
    const learners = [];
    const assessors = [];

    // Classify users based on their roles
    users.forEach((user) => {
      switch (user.role) {
        case "admin":
          admins.push(user);
          break;
        case "super_admin":
          superadmin.push(user);
          break;
        case "learner":
          learners.push(user);
          break;
        case "assessor":
          assessors.push(user);
          break;
        default:
          break;
      }
    });

    return res.json({
      superadmin,
      admins,
      learners,
      assessors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createUsers,
  createUser,
  getUsersByRole,
  updateUser,
  removeUser,
  getAllUsers,
  getUserDetailsById,
  assignCourseToUser,
};
