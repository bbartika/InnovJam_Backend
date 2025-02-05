// controllers/fileController.js
const File = require('../Model/file'); // Import the File model
const fs = require('fs');
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth"); // Using Mammoth for DOCX files
const path = require('path');
const { getIo } = require('../socket'); // Import getIo

// Function to extract text from a PDF file
const parsePdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error during PDF parsing:", error.message);
    throw new Error("Error parsing PDF.");
  }
};

// Function to extract text from a DOCX file
const parseDocx = async (filePath) => {
  try {
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value; // Return the extracted text
  } catch (error) {
    console.error("Error during DOCX parsing:", error.message);
    throw new Error("Error parsing DOCX.");
  }
};

//For uploading assessment files/
const uploadFile = async (req, res) => {
  const { title } = req.body;
  const file = req.file;
  console.log("File:", file);

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Save file details to MongoDB
  try {

    let extractedText = "";

    // Check the file type and extract text accordingly
    if (path.extname(file.originalname).toLowerCase() === ".pdf") {
      extractedText = await parsePdf(file.path); // Extract text from a PDF file
    } else if (path.extname(file.originalname).toLowerCase() === ".docx") {
      extractedText = await parseDocx(file.path); // Extract text from a DOCX file
    }
    //console.log(extractedText);


    const newFile = new File({
      title: title,
      fileName: file.filename,
      filePath: path.join(__dirname, '..', 'files', file.filename),
      content: extractedText, // Store the extracted text in the 'content' field
    });

    await newFile.save();
    console.log("saved file in database", newFile);  // Debugging log to confirm save

    // Emit event via Socket.io to notify frontend
    getIo().emit('fileUploaded'); // Use getIo() to access the socket instance

    res.status(200).json({
      message: 'File uploaded and saved to database',
      content: extractedText, // Return the extracted text
      fileUrl: `http://localhost:1900/uploads/${file.filename}`, // URL to access the uploaded file
      file: newFile,
    });
  } catch (error) {
    console.error('Error saving file to database:', error);
    res.status(500).json({ message: 'Error saving file to database', error: error.message });
  }
};

const deleteFileById = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the file by ID
    const file = await File.findById(id); if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }  // Delete the file from the database

    //find and delete the file from the database
    const deletedFile = await File.findByIdAndDelete(id);

    if (!deletedFile) {
      return res.status(404).json({ message: 'File not found' });
    }

    //get file path from the deleted document
    const filePath = deletedFile.filePath;

    //delete the file from local storage
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
          return res.status(500).json({ message: 'Failed to delete file from local storage' });
        }
      });
    }

    // Emit WebSocket event if necessary
    // Assuming `io` is initialized elsewhere and imported or available globally
    // Emit the fileDeleted event
    getIo().emit('fileDeleted', deletedFile);

    res.status(200).json({ message: 'File deleted successfully', file: deletedFile });


  }
  catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

module.exports = {
  uploadFile,
  deleteFileById,
};
