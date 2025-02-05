const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./db.js')
const app = express();
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes.js')
const fileRoutes = require('./routes/fileRoutes.js')
const http = require('http');
const { init } = require('./socket.js');
const server = http.createServer(app); // Create HTTP server to work with socket.io
const io = init(server); // Initialize socket.io and pass it to the module
const assessmentRoutes = require('./routes/assessmentRoutes.js')
const courseRoutes = require('./routes/courseRoutes')
const userRoutes = require('./routes/userRoutes.js')
const courswareRoutes = require('./routes/coursewareRoutes.js')

// Use CORS to allow your frontend React app to access the backend
app.use(cors());
app.use(express.json())

// Load environment variables
dotenv.config();

//middleware
app.use(cors())


//connect to database
connectDB()

// Use file routes
app.use('/api', fileRoutes);

// Assuming the MongoDB connection is already established
const db = mongoose.connection;

// When a new file is uploaded, emit a WebSocket event to notify all clients
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('fileUploaded', () => {
    // Emit the 'fileUploaded' event to all connected clients
    io.emit('fileUploaded');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  })
})

//to get db structure
app.get('/api/db/all-files', async (req, res) => {
  try {
    const files = await db.collection('files').find().toArray();
    res.json({ files });
  } catch (error) {
    console.error("Error inspecting database:", error);
    res.status(500).send("Error inspecting the database")
  }
})


app.use('/api/auth', authRoutes)
app.use('/api', fileRoutes);
app.use('/api/assessments', assessmentRoutes)
app.use('/api', courseRoutes);
app.use("/api/users", userRoutes)
app.use("/api/courseware", courswareRoutes)

// Example: Home route to test server
app.get('/', (req, res) => {
  res.send('Welcome to the server!');
})

// Start the server
const PORT = process.env.PORT || 9100; // Use the PORT from the .env file or default to 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})