const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.post('/', requireRole('customer'), bookingController.createBooking);
router.get('/booked-slots', requireRole('customer'), bookingController.getBookedSlots);
router.get('/customer', requireRole('customer'), bookingController.getMyCustomerBookings);
router.get('/worker', requireRole('worker'), bookingController.getMyWorkerBookings);

router.patch('/:id/accept', requireRole('worker'), bookingController.acceptBooking);
router.patch('/:id/reject', requireRole('worker'), bookingController.rejectBooking);
router.patch('/:id/complete', requireRole('worker'), bookingController.completeBooking);
router.post('/:id/rate', requireRole('customer'), bookingController.rateBooking);

module.exports = router;
