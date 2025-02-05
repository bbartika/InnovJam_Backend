const mongoose = require("mongoose");
require("dotenv").config()

const databaseConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = databaseConnection;
