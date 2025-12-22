const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getRazorpayKey, getMyPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/create-order', protect, authorize('student'), createOrder);
router.post('/verify', protect, authorize('student'), verifyPayment);
router.get('/key', protect, getRazorpayKey);
router.get('/my-history', protect, authorize('student'), getMyPayments);

module.exports = router;
