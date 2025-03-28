const File = require('../Model/file');
const Course = require('../Model/CourseSchema_model');
const mongoIdVerification = require('../services/mongoIdValidation');
const fs = require('fs');
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const path = require('path');

// 📝 Function to extract text from a PDF file
const parsePdf = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist.");
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    if (!dataBuffer || dataBuffer.length === 0) {
      throw new Error("Empty PDF file.");
    }

    const data = await pdfParse(dataBuffer);
    return data.text || "No text extracted from PDF.";
  } catch (error) {
    console.error("❌ Error during PDF parsing:", error.message);
    return "Error parsing PDF.";
  }
};

// 📝 Function to extract text from a DOCX file
const parseDocx = async (filePath) => {
  try {
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value || "No text extracted from DOCX.";
  } catch (error) {
    console.error("❌ Error during DOCX parsing:", error.message);
    return "Error parsing DOCX.";
  }
};

// 📂 Upload assessment files
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

    if (ext === ".pdf") {
      extractedText = await parsePdf(file.path);
    } else if (ext === ".docx") {
      extractedText = await parseDocx(file.path);
    }

    // Generate a unique filename
    const fileName = `${Date.now()}_${file.originalname}`;

    const newFile = new File({
      title,
      courseId,
      fileName,
      content: extractedText,
    });

    await newFile.save();

    res.status(200).json({
      fileId: newFile._id,
      uploaded: true,
      message: 'File uploaded and saved to database',
    });

  } catch (error) {
    console.error('❌ Error saving file to database:', error);
    res.status(500).json({ message: 'Error saving file to database', error: error.message });
  }
};

// ✏️ Update an existing file
const updateFile = async (req, res) => {
  const { courseId, title } = req.body;
  const { fileId } = req.params;
  const file = req.file;

  try {
    if (!mongoIdVerification(fileId) || (courseId && !mongoIdVerification(courseId))) {
      return res.status(400).json({ message: "Invalid file ID or course ID." });
    }

    const existingFile = await File.findById(fileId);
    if (!existingFile) {
      return res.status(404).json({ message: "File not found." });
    }

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found." });
      }
    }

    let updatedFields = { title };
    
    if (file) {
      let extractedText = "";
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === ".pdf") {
        extractedText = await parsePdf(file.path);
      } else if (ext === ".docx") {
        extractedText = await parseDocx(file.path);
      }

      const fileName = `${Date.now()}_${file.originalname}`;
      updatedFields.fileName = fileName;
      updatedFields.content = extractedText;
    }

    const updatedFile = await File.findByIdAndUpdate(fileId, updatedFields, { new: true });

    res.status(200).json({
      fileId: updatedFile._id,
      updated: true,
      message: "File updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating file:", error);
    res.status(500).json({ message: "Error updating file", error: error.message });
  }
};

// 📁 Get all files for a specific course
const getFilesByClass = async (req, res) => {
  const { courseId } = req.params;

  try {
    if (!mongoIdVerification(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const files = await File.find({ courseId }).select('-content');

    if (!files.length) {
      return res.status(200).json({ message: 'No files found for this course', files: [] });
    }

    res.status(200).json(files);
  } catch (error) {
    console.error("❌ Error fetching files:", error);
    res.status(500).json({ message: "Failed to fetch files", error: error.message });
  }
};

// ❌ Delete a file by ID
const deleteFileById = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const filePath = path.join(__dirname, '../files', file.fileName);

    await File.findByIdAndDelete(id);

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('❌ Error deleting local file:', err);
          return res.status(500).json({ message: 'Failed to delete file from local storage' });
        }
      });
    }

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

module.exports = {
  uploadFile,
  updateFile,
  getFilesByClass,
  deleteFileById,
};
