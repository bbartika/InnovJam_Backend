require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const http = require('http');

// Import utility functions and routes
const databaseConnection = require('./utils/database.js');
const { init } = require('./socket.js');

const authRoutes = require('./routes/authRoutes.js');
const fileRoutes = require('./routes/fileRoutes.js');
const assessmentRoutes = require('./routes/assessmentRoutes.js');
const courseRoutes = require('./routes/courseRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const coursewareRoutes = require('./routes/coursewareRoutes.js');
const initialUser = require('./services/initialUser');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = init(server);

// Middleware setup
app.use(cors());
app.use(express.json());

// Connect to MongoDB
db = databaseConnection();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('fileUploaded', () => {
    io.emit('fileUploaded');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Define API routes
app.use('/api/auth', authRoutes);
app.use('/api', fileRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courseware', coursewareRoutes);

// Route to inspect database structure (Retrieve all files from the database)
app.get('/api/db/all-files', async (req, res) => {
  try {
    const files = await db.collection('files').find().toArray();
    res.json({ files });
  } catch (error) {
    console.error('Error inspecting database:', error);
    res.status(500).send('Error inspecting the database');
  }
});

// Home route for testing the server
app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

// Start the server on the specified port
const PORT = process.env.PORT || 9100;

server.listen(PORT, async () => {
  await initialUser();
  console.log(`Server running on port ${PORT}`);
});
