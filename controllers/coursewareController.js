const Courseware = require('../Model/Courseware');

// Upload a new courseware document
exports.uploadCourseware = async (req, res) => {
    const { fileName, course_id, assessment_name, assessment_id } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'File is required' });
    }

    try {
        const newCourseware = new Courseware({
            fileName,
            file: file.path,  
            course_id,
            assessment_name,
            assessment_id,
        });

        await newCourseware.save();
        res.status(201).json({
            message: 'Courseware uploaded successfully',
            courseware: newCourseware,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error uploading courseware', error: err.message });
    }
};

// Get all courseware
exports.getAllCourseware = async (req, res) => {
    try {
        const courseware = await Courseware.find()
        res.status(200).json(courseware);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching courseware', error: err.message });
    }
};

// Get courseware by ID
exports.getCoursewareById = async (req, res) => {
    const { id } = req.params;

    try {
        const courseware = await Courseware.findById(id).populate('course_id assessment_id');
        if (!courseware) {
            return res.status(404).json({ message: 'Courseware not found' });
        }
        res.status(200).json(courseware);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching courseware by ID', error: err.message });
    }
};

// Get courseware by course name
exports.getCoursewareByCourseName = async (req, res) => {
    const { courseName } = req.params;

    try {
        const courseware = await Courseware.findOne({ 'course_id.courseName': courseName }).populate('course_id assessment_id');
        if (!courseware) {
            return res.status(404).json({ message: 'Courseware not found' });
        }
        res.status(200).json(courseware);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching courseware by course name', error: err.message });
    }
};
