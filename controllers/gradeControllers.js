const Grade = require('../Model/gradeModel');
const GradeRange = require('../Model/gradeRangeModel');
const Assessment = require('../Model/assessment_model');

const createGrade = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newGrade = new Grade({ name, status: false });
        await newGrade.save();
        res.status(201).json(newGrade);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update an existing Grade
const updateGrade = async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;
    try {

        if (!name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const updatedGrade = await Grade.findByIdAndUpdate(id, { name, status }, { new: true });

        if (!updatedGrade) {
            return res.status(404).json({ error: 'Grade not found' });
        }

        res.status(200).json(updatedGrade);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove a Grade
const removeGrade = async (req, res) => {
    const { id } = req.params;
    try {

        const assessments = await Assessment.find({ grade_id: id });

        if (assessments.length > 0) {
            return res.status(400).json({ error: 'Cannot delete a grade with associated assessments' });
        }
        const deletedGrade = await Grade.findByIdAndDelete(id);

        if (!deletedGrade) {
            return res.status(404).json({ error: 'Grade not found' });
        }

        await GradeRange.deleteMany({ grade_id: id });

        res.status(200).json({ message: 'Grade deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all Grades
const getAllGrades = async (req, res) => {
    try {
        const grades = await Grade.find();
        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllGradesStatusTrue = async (req, res) => {
    try {
        const grades = await Grade.find({ status: true });
        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Get a Grade by ID
const getGradeById = async (req, res) => {
    try {
        const { id } = req.params;
        const grade = await Grade.findById(id);
        if (!grade) {
            return res.status(404).json({ error: 'Grade not found' });
        }
        res.status(200).json(grade);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createGrade,
    updateGrade,
    removeGrade,
    getAllGrades,
    getGradeById,
    getAllGradesStatusTrue
};
