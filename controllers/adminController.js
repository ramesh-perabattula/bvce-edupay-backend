const User = require('../models/User');
const Student = require('../models/Student');
const ExamNotification = require('../models/ExamNotification');
const SystemConfig = require('../models/SystemConfig');

// @desc    Create a new student with user profile
// @route   POST /api/admin/students
// @access  Private (Admin)
// @desc    Create a new student with user profile
// @route   POST /api/admin/students
// @access  Private (Admin)
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

        // 2. Determine initial fees
        let initialCollegeFee = 0;

        if (quota === 'management') {
            initialCollegeFee = assignedCollegeFee || 0;
        } else {
            // Fetch Default Gov Fee
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
            currentYear: Number(currentYear),
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

// @desc    Update Student Fees
// @route   PUT /api/admin/students/:usn/fees
// @access  Private (Admin)
const updateStudentFees = async (req, res) => {
    try {
        const {
            collegeFeeDue, transportFeeDue, lastSemDues, status, transportOpted, // Direct updates
            feeRecordId, amount, mode, reference // Payment Transaction
        } = req.body;

        const student = await Student.findOne({ usn: req.params.usn });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // 1. Handle Ledger Payment Transaction
        if (feeRecordId && amount) {
            // Ensure feeRecords is initialized
            if (!student.feeRecords) {
                student.feeRecords = [];
            }

            // Find record safely
            const record = student.feeRecords.find(r => r._id.toString() === feeRecordId);

            if (!record) {
                console.error(`Fee Record not found: ${feeRecordId}`);
                return res.status(404).json({ message: 'Fee Record not found' });
            }

            // Update Paid Amount
            const paymentAmount = Number(amount); // Ensure number
            record.amountPaid = (record.amountPaid || 0) + paymentAmount;

            // Update Status
            if (record.amountPaid >= record.amountDue) {
                record.status = 'paid';
            } else if (record.amountPaid > 0) {
                record.status = 'partial';
            }

            // Add Transaction Log
            record.transactions.push({
                amount: paymentAmount,
                date: new Date(),
                mode: mode || 'Manual',
                reference: reference || 'Admin Update'
            });

            // Sync with Top-level Dues
            if (record.feeType === 'college') {
                student.collegeFeeDue = Math.max(0, (student.collegeFeeDue || 0) - paymentAmount);
            }
            if (record.feeType === 'transport') {
                student.transportFeeDue = Math.max(0, (student.transportFeeDue || 0) - paymentAmount);
            }
        }

        // 2. Handle Manual Direct Updates
        if (collegeFeeDue !== undefined) {
            student.collegeFeeDue = collegeFeeDue;
            // If marked as paid (0), sync any pending ledger records
            if (collegeFeeDue === 0 && student.feeRecords) {
                student.feeRecords.forEach(r => {
                    if (r.feeType === 'college' && r.status !== 'paid') {
                        r.status = 'paid';
                        r.amountPaid = r.amountDue;
                        r.transactions.push({
                            amount: r.amountDue - (r.amountPaid || 0),
                            date: new Date(),
                            mode: 'Auto-Clear',
                            reference: 'Admin Marked Paid'
                        });
                    }
                });
            }
        }

        if (transportFeeDue !== undefined) {
            student.transportFeeDue = transportFeeDue;
            // If marked as paid (0), sync any pending ledger records
            if (transportFeeDue === 0 && student.feeRecords) {
                student.feeRecords.forEach(r => {
                    if (r.feeType === 'transport' && r.status !== 'paid') {
                        r.status = 'paid';
                        r.amountPaid = r.amountDue;
                        r.transactions.push({
                            amount: r.amountDue - (r.amountPaid || 0),
                            date: new Date(),
                            mode: 'Auto-Clear',
                            reference: 'Admin Marked Paid'
                        });
                    }
                });
            }
        }

        if (lastSemDues !== undefined) student.lastSemDues = lastSemDues;
        if (status !== undefined) student.status = status;
        if (transportOpted !== undefined) student.transportOpted = transportOpted;

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        console.error("Update Fee Error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Set Default Government Fee (And Apply)
// @route   POST /api/admin/config/gov-fee
// @access  Private (Admin)
const setGovFee = async (req, res) => {
    try {
        const { quota, currentYear, amount, usn } = req.body;

        if (!quota || !amount) {
            return res.status(400).json({ message: 'Quota and Amount are required' });
        }

        if (quota === 'government') {
            // Updated Logic: Apply to ALL Govt students in a specific Year
            if (!currentYear) {
                return res.status(400).json({ message: 'Year is required for Government Quota bulk update' });
            }

            const result = await Student.updateMany(
                { quota: 'government', currentYear: Number(currentYear) },
                { $set: { collegeFeeDue: parseInt(amount) } }
            );

            // Also update System Config for default future ref
            await SystemConfig.findOneAndUpdate(
                { key: 'default_gov_fee' },
                { value: parseInt(amount) },
                { upsert: true }
            );

            res.json({ message: `Updated fees for ${result.modifiedCount} students in Year ${currentYear}` });

        } else if (quota === 'management') {
            if (!usn || !currentYear) {
                return res.status(400).json({ message: 'Student USN and Year are required for Management Quota' });
            }

            const student = await Student.findOne({ usn: usn, quota: 'management' });

            if (!student) {
                return res.status(404).json({ message: 'Management Student not found with this USN' });
            }

            // Create Fee Record
            const feeRecord = {
                year: Number(currentYear),
                feeType: 'college',
                amountDue: parseInt(amount),
                amountPaid: 0,
                status: 'pending',
                transactions: []
            };

            // Check if record exists for this year/type
            const existingRecordIndex = student.feeRecords.findIndex(
                r => r.year == currentYear && r.feeType === 'college'
            );

            if (existingRecordIndex !== -1) {
                // Update existing record
                const oldDue = student.feeRecords[existingRecordIndex].amountDue;
                student.feeRecords[existingRecordIndex].amountDue = parseInt(amount);

                // Update Status based on new Due vs Paid
                const paid = student.feeRecords[existingRecordIndex].amountPaid;
                student.feeRecords[existingRecordIndex].status =
                    paid >= parseInt(amount) ? 'paid' :
                        paid > 0 ? 'partial' : 'pending';

                // Update Total Due (Legacy sync)
                student.collegeFeeDue = (student.collegeFeeDue || 0) - oldDue + parseInt(amount);

            } else {
                // Add new record
                student.feeRecords.push(feeRecord);
                student.collegeFeeDue = (student.collegeFeeDue || 0) + parseInt(amount);
            }

            await student.save();

            res.json({ message: `Fee Allocated to Management Student ${usn}`, student });
        } else {
            res.status(400).json({ message: 'Invalid Quota' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get System Config
// @route   GET /api/admin/config
const getSystemConfig = async (req, res) => {
    try {
        const govFee = await SystemConfig.findOne({ key: 'default_gov_fee' });
        res.json({
            defaultGovFee: govFee ? govFee.value : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search Student by USN
// @route   GET /api/admin/students/search
const searchStudent = async (req, res) => {
    try {
        const { query } = req.query;
        // Search by USN (exact or partial)
        const student = await Student.findOne({ usn: { $regex: query, $options: 'i' } })
            .populate('user', 'name email');

        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Exam Notification
// @route   POST /api/admin/notifications
// @access  Private (Admin)
const createExamNotification = async (req, res) => {
    try {
        const notification = await ExamNotification.create(req.body);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Active Notifications
// @route   GET /api/admin/notifications
// @access  Public (or Private)
const getExamNotifications = async (req, res) => {
    try {
        const notifications = await ExamNotification.find({ isActive: true });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Stats for Dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin/Principal)
const getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ status: 'active' });

        const byDepartment = await Student.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);

        const byQuota = await Student.aggregate([
            { $group: { _id: "$quota", count: { $sum: 1 } } }
        ]);

        const byEntryType = await Student.aggregate([
            { $group: { _id: "$entry", count: { $sum: 1 } } }
        ]);

        res.json({
            totalStudents,
            activeStudents,
            byDepartment,
            byQuota,
            byEntryType
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createStudent,
    updateStudentFees,
    createExamNotification,
    getExamNotifications,
    getDashboardStats,
    setGovFee,
    getSystemConfig,
    searchStudent
};
