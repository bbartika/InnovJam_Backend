require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const http = require('http');

// Import utility functions and routes
const databaseConnection = require('./utils/database.js');

const authRoutes = require('./routes/authRoutes.js');
const fileRoutes = require('./routes/fileRoutes.js');
const assessmentRoutes = require('./routes/assessmentRoutes.js');
const courseRoutes = require('./routes/courseRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const coursewareRoutes = require('./routes/coursewareRoutes.js');
const gradeRoutes = require('./routes/gradeRoutes.js')
const gradeRangeRoutes = require('./routes/gradeRangeRoutes.js')
const assignedAssessmentRoutes = require('./routes/assignAssessmentRoutes')
const studentAnswerRoutes = require('./routes/studentAnswerRoutes.js')
const assessorRoutes = require('./routes/assessorRoutes.js')
const aiModelRoutes = require('./routes/aiModelRoutes.js')
const initialUser = require('./services/initialUser');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(cors());
app.use(express.json());

// Define API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courseware', coursewareRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/grade-ranges', gradeRangeRoutes);
app.use('/api/assigned-assessments', assignedAssessmentRoutes);
app.use('/api/assessors', assessorRoutes);
app.use('/api/student-answers', studentAnswerRoutes);
app.use('/api/ai-models', aiModelRoutes);

// Home route for testing the server
app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

// Start the server on the specified port
const PORT = process.env.PORT || 9100;

server.listen(PORT, async () => {
  await databaseConnection();
  await initialUser();
  console.log(`Server running on port ${PORT}`);
});
