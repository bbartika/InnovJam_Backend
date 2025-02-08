const GradeRange = require('../Model/gradeRangeModel');
const Grade = require('../Model/gradeModel');
const mongoIdVerification = require('../services/mongoIdValidation');

const createGradeRange = async (req, res) => {
    const { grade_id, label, startRange, endRange } = req.body;

    try {
        if (!grade_id || !label || startRange < 0 || !endRange) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!mongoIdVerification(grade_id)) {
            return res.status(400).json({ message: "Invalid grade ID." });
        }

        const grade = await Grade.findById(grade_id);
        if (!grade) {
            return res.status(404).json({ error: 'Grade not found' });
        }

        if (startRange > endRange) {
            return res.status(400).json({ error: 'Start range cannot be greater than end range' });
        }

        const newRange = new GradeRange({ grade_id, label, startRange, endRange });
        await newRange.save();

        grade.status = true;
        await grade.save();

        res.status(201).json({ message: 'Range created successfully', range: newRange });
    } catch (error) {
        res.status(500).json({ message: 'Error creating range', error: error.message });
    }
};

const getGradeRangeByGradeId = async (req, res) => {
    const { grade_id } = req.params;

    try {
        if (!mongoIdVerification(grade_id)) {
            return res.status(400).json({ message: "Invalid grade ID." });
        }

        const gradeRanges = await GradeRange.find({ grade_id });

        if (!gradeRanges.length) {
            return res.status(404).json({ message: 'No grade ranges found for this grade ID' });
        }

        res.status(200).json({ gradeRanges });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching grade ranges', error: error.message });
    }
};

const removeGradeRange = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoIdVerification(id)) {
            return res.status(400).json({ message: "Invalid range ID." });
        }

        const range = await GradeRange.findByIdAndDelete(id);
        if (!range) {
            return res.status(404).json({ message: "Grade range not found" });
        }

        res.status(200).json({ message: "Grade range deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting grade range', error: error.message });
    }
};

const updateGradeRange = async (req, res) => {
    const { id } = req.params;
    const { label, startRange, endRange } = req.body;

    try {
        if (!mongoIdVerification(id)) {
            return res.status(400).json({ message: "Invalid range ID." });
        }

        const range = await GradeRange.findById(id);
        if (!range) {
            return res.status(404).json({ message: "Grade range not found" });
        }

        if (startRange > endRange) {
            return res.status(400).json({ error: 'Start range cannot be greater than end range' });
        }

        range.label = label || range.label;
        range.startRange = startRange ?? range.startRange;
        range.endRange = endRange ?? range.endRange;

        await range.save();

        res.status(200).json({ message: "Grade range updated successfully", range });
    } catch (error) {
        res.status(500).json({ message: 'Error updating grade range', error: error.message });
    }
};

module.exports = { createGradeRange, getGradeRangeByGradeId, removeGradeRange, updateGradeRange };
