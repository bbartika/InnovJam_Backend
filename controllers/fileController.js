const File = require('../Model/file');
const Course = require('../Model/CourseSchema_model')
const mongoIdVerification = require('../services/mongoIdValidation')
const fs = require('fs');
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const path = require('path');
const assessment = require("../Model/assessment_model");
const { getIo } = require('../socket');

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
    return data.value;
  } catch (error) {
    console.error("Error during DOCX parsing:", error.message);
    throw new Error("Error parsing DOCX.");
  }
};

// Upload assessment files
const uploadFile = async (req, res) => {
  const { courseId, title } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {

    if (!mongoIdVerification(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let extractedText = "";
    const ext = path.extname(file.originalname).toLowerCase();

    // Extract text based on file type
    if (ext === ".pdf") {
      extractedText = await parsePdf(file.path);
    } else if (ext === ".docx") {
      extractedText = await parseDocx(file.path);
    }

    // Ensure filename is unique
    const fileName = `${Date.now()}_${file.originalname}`;

    // Save file metadata to database
    const newFile = new File({
      title: title,
      courseId: courseId,
      fileName: fileName,
      content: extractedText,
    });

    await newFile.save();

    res.status(200).json({
      fileId: newFile._id,
      uploaded: true,
      message: 'File uploaded and saved to database',
    });

  } catch (error) {
    console.error('Error saving file to database:', error);
    res.status(500).json({ message: 'Error saving file to database', error: error.message });
  }
};

const updateFile = async (req, res) => {
  const { courseId, title } = req.body;
  const { fileId } = req.params;
  const file = req.file;

  try {
    if (!mongoIdVerification(fileId) || (courseId && !mongoIdVerification(courseId))) {
      return res.status(400).json({ message: "Invalid file ID or course ID." });
    }

    let existingFile = await File.findById(fileId);
    if (!existingFile) {
      return res.status(404).json({ message: "File not found." });
    }

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found." });
      }
    }

    let updatedFields = { title: title };

    if (file) {
      let extractedText = "";
      const ext = path.extname(file.originalname).toLowerCase();

      // Extract text from new file if applicable
      if (ext === ".pdf") {
        extractedText = await parsePdf(file.path);
      } else if (ext === ".docx") {
        extractedText = await parseDocx(file.path);
      }

      // Generate a new unique filename
      const fileName = `${Date.now()}_${file.originalname}`;

      updatedFields.fileName = fileName;
      updatedFields.content = extractedText;
    }

    // Update the file in the database
    const updatedFile = await File.findByIdAndUpdate(fileId, updatedFields, { new: true });

    res.status(200).json({
      fileId: updatedFile._id,
      updated: true,
      message: "File updated successfully",
    });

  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ message: "Error updating file", error: error.message });
  }
};

const getFilesByClass = async (req, res) => {
  const { courseId } = req.params;

  try {
    if (!mongoIdVerification(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const files = await File.find({ courseId: courseId }).select('-content');

    if (!files) {
      return res.status(404).json({ message: 'Files not found', files: [] });
    }

    res.status(200).json(files);

  }
  catch (error) {

  }
}

// Delete file by ID
const deleteFileById = async (req, res) => {
  const { id } = req.params;

  try {

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    // Derive file path from static folder
    const filePath = path.join(__dirname, '../files', file.fileName);

    // Delete file from database
    await File.findByIdAndDelete(id);

    // Delete file from local storage
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
          return res.status(500).json({ message: 'Failed to delete file from local storage' });
        }
      });
    }

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

module.exports = {
  uploadFile,
  deleteFileById,
  getFilesByClass,
  updateFile
};
