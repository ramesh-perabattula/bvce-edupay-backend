const Student = require('../models/Student');

// @desc    Search Student by USN
// @route   GET /api/transport/students/search
// @access  Private (Transport Dept)
const searchStudentForTransport = async (req, res) => {
    try {
        const { query } = req.query;
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

// @desc    Update Transport Details
// @route   PUT /api/transport/students/:usn
// @access  Private (Transport Dept)
// @desc    Update Transport Details
// @route   PUT /api/transport/students/:usn
// @access  Private (Transport Dept)
const updateTransportDetails = async (req, res) => {
    try {
        const { transportOpted, transportFeeDue } = req.body;
        const student = await Student.findOne({ usn: req.params.usn });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (transportOpted !== undefined) student.transportOpted = transportOpted;

        if (transportFeeDue !== undefined) {
            const newDue = Number(transportFeeDue);
            const oldDue = student.transportFeeDue || 0;
            student.transportFeeDue = newDue;

            // Sync with Ledger if marking as PAID (0)
            if (newDue === 0 && student.feeRecords) {
                // Find latest active transport record
                const transportRecord = student.feeRecords.find(r =>
                    r.feeType === 'transport' && r.status !== 'paid'
                );

                if (transportRecord) {
                    transportRecord.amountPaid = transportRecord.amountDue; // Mark fully paid
                    transportRecord.status = 'paid';
                    transportRecord.transactions.push({
                        amount: transportRecord.amountDue,
                        date: new Date(),
                        mode: 'Transport Dept',
                        reference: 'Marked as Paid by Transport Dept'
                    });
                }
            }
        }

        const updatedStudent = await student.save();
        res.json(updatedStudent);

    } catch (error) {
        console.error("Transport Update Error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = { searchStudentForTransport, updateTransportDetails };
