// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Import the upload middleware
const { uploadFile } = require('../controllers/fileController'); // Import the file upload controller
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { createExam } = require('../controllers/createExamController'); // Import the new controller
const {deleteFileById} = require('../controllers/fileController'); // Import the delete controller

// Assuming the MongoDB connection is already established
const db = mongoose.connection;

//define the directory where files are stored
const filesDirectory = path.join(__dirname, '..', 'files'); // This is where Multer stores files

//route to fetch all uploaded files
router.get('/files', (req,res)=>{
    
    //check if the 'upload' directory exists
    if (!fs.existsSync(uploadsDir)) {
        return res.status(404).json({ message: 'No files found' });
      }
    
      // Read the files in the uploads directory
      const files = fs.readdirSync(filesDirectory);
    
      // Send the list of files as the response
      res.json({ files });
})


//Route to delete a file by ID
router.delete('/delete-file/:id', deleteFileById);






// POST route to upload files
router.post('/upload-assesmentFiles', upload, uploadFile); // Upload file and then handle the logic in the controller

// POST route to create exam from uploaded file
router.post('/create-exam/:id', createExam); 
// Triggers the AI API call after the user clicks create exam


module.exports = router;
