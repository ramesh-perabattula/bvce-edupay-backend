const express = require('express');
const router = express.Router();
const { searchStudentForTransport, updateTransportDetails } = require('../controllers/transportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/students/search', protect, authorize('transport_dept', 'admin'), searchStudentForTransport);
router.put('/students/:usn', protect, authorize('transport_dept', 'admin'), updateTransportDetails);

module.exports = router;
