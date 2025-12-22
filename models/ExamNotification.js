const mongoose = require('mongoose');

const examNotificationSchema = mongoose.Schema({
    title: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 4 }, // Target Year (1,2,3,4)
    examFeeAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ExamNotification', examNotificationSchema);
