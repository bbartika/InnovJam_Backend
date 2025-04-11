require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");

// const nodeMailer = require('nodemailer');

// Import utility functions and routes
const databaseConnection = require("./utils/database.js");

const authRoutes = require("./routes/authRoutes.js");
const fileRoutes = require("./routes/fileRoutes.js");
const assessmentRoutes = require("./routes/assessmentRoutes.js");
const courseRoutes = require("./routes/courseRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const coursewareRoutes = require("./routes/coursewareRoutes.js");
const gradeRoutes = require("./routes/gradeRoutes.js");
const gradeRangeRoutes = require("./routes/gradeRangeRoutes.js");
const assignedAssessmentRoutes = require("./routes/assignAssessmentRoutes");
const studentAnswerRoutes = require("./routes/studentAnswerRoutes.js");
const assessorRoutes = require("./routes/assessorRoutes.js");
const archiveStudentResponseRoutes = require("./routes/archiveStudentResponseRoutes.js");
const aiModelRoutes = require("./routes/aiModelRoutes.js");

const initialUser = require("./services/initialUser");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(cors());
app.use(express.json());

// Define API routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courseware", coursewareRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/grade-ranges", gradeRangeRoutes);
app.use("/api/assigned-assessments", assignedAssessmentRoutes);
app.use("/api/assessors", assessorRoutes);
app.use("/api/student-answers", studentAnswerRoutes);
app.use("/api/ai-models", aiModelRoutes);
app.use("/api/archive-student-responses", archiveStudentResponseRoutes);

// Home route for testing the server
app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

// Start the server on the specified port
const PORT = process.env.PORT || 9100;

app.all("*", (req, res) => {
  res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 - Page Not Found</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f9;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  color: #333;
              }

              .container {
                  text-align: center;
                  background-color: #fff;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                  max-width: 400px;
                  width: 100%;
              }

              h1 {
                  font-size: 60px;
                  color: #e74c3c;
                  margin-bottom: 20px;
              }

              p {
                  font-size: 18px;
                  color: #555;
              }

              .btn {
                  display: inline-block;
                  margin-top: 20px;
                  padding: 12px 24px;
                  font-size: 16px;
                  background-color: #3498db;
                  color: #fff;
                  text-decoration: none;
                  border-radius: 5px;
                  transition: background-color 0.3s ease;
              }

              .btn:hover {
                  background-color: #2980b9;
              }
          </style>
      </head>
      <body>

          <div class="container">
              <h1>404</h1>
              <p>Page Not Found please go back to home page</p>
              <a href="/" class="btn">Go Back Home</a>
          </div>

      </body>
      </html>
  `);
});

server.listen(PORT, async () => {
  await databaseConnection();
  await initialUser();
  console.log(`Server running on port ${PORT}`);
});
