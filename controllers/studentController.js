const Student = require('../models/Student');

// @desc    Get current student profile
// @route   GET /api/students/profile
// @access  Private (Student)
const getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user._id }).populate('user', 'name email');

        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ message: 'Student profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check exam eligibility
// @route   GET /api/students/eligibility
// @access  Private (Student)
const checkEligibility = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user._id });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let isEligible = true;
        let reasons = [];

        if (student.status !== 'active') {
            isEligible = false;
            reasons.push(`Student status is ${student.status}`);
        }

        if (student.collegeFeeDue > 0) {
            isEligible = false;
            reasons.push(`Pending College Fee: ${student.collegeFeeDue}`);
        }

        if (student.transportFeeDue > 0) {
            isEligible = false;
            reasons.push(`Pending Transport Fee: ${student.transportFeeDue}`);
        }

        if (student.lastSemDues > 0) {
            isEligible = false;
            reasons.push(`Pending Last Semester Dues: ${student.lastSemDues}`);
        }

        res.json({
            isEligible,
            reasons,
            student: {
                usn: student.usn,
                name: req.user.name,
                collegeFeeDue: student.collegeFeeDue,
                transportFeeDue: student.transportFeeDue,
                lastSemDues: student.lastSemDues
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStudentProfile, checkEligibility };
