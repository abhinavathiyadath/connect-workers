const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin'));

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/workers/pending', adminController.getPendingWorkers);
router.patch('/workers/:id/approval', adminController.setWorkerApproval);
router.get('/bookings', adminController.getAllBookings);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
