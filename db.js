const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file

const connectDB = async () => {
  try {
    // Connect to MongoDB using the DB_URI environment variable
    await mongoose.connect(process.env.MONGO_URL);

    console.log("Hey Devmalya MongoDB connected succesfully...");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
