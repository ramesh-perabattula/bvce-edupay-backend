const User = require('../models/User');
const Student = require('../models/Student');
const SystemConfig = require('../models/SystemConfig');

// @desc    Create a new student
// @route   POST /api/registrar/students
// @access  Private (Registrar)
const createStudent = async (req, res) => {
    try {
        const {
            username, password, name, department, currentYear,
            quota, entry, email,
            transportOpted, // Boolean
            assignedCollegeFee, // For Management Quota
            assignedTransportFee // If transportOpted is true
        } = req.body;

        // 1. Create User
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({
            username,
            password,
            name,
            email,
            role: 'student'
        });

        // 2. Determine fees
        let initialCollegeFee = 0;
        if (quota === 'management') {
            initialCollegeFee = assignedCollegeFee || 0;
        } else {
            // Fetch Default Gov Fee
            // Note: If dynamic year fee logic exists, we should technically query that, 
            // but for now we fallback to global default or 0.
            const config = await SystemConfig.findOne({ key: 'default_gov_fee' });
            initialCollegeFee = config ? config.value : 0;
        }

        let initialTransportFee = 0;
        if (transportOpted) {
            initialTransportFee = assignedTransportFee || 0;
        }

        // 3. Create Student Profile
        const student = await Student.create({
            user: user._id,
            usn: username,
            department,
            currentYear: parseInt(currentYear) || 1, // Default to 1 if missing
            quota,
            entry,
            transportOpted: transportOpted || false,
            collegeFeeDue: initialCollegeFee,
            transportFeeDue: initialTransportFee
        });

        res.status(201).json(student);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset User Password
// @route   POST /api/registrar/reset-password
// @access  Private (Registrar)
const resetPassword = async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        // Note: The User model pre-save hook should handle hashing.
        // If the model checks isModified('password'), assigning it here triggers it.

        await user.save();

        res.json({ message: `Password reset successful for user ${username}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createStudent, resetPassword };
