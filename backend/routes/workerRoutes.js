const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { protect, requireRole } = require('../middleware/auth');

// Public: recommended workers (customer sends lat/lng from location page)
router.get('/recommended', workerController.getRecommended);
router.get('/public/:userId', workerController.getWorkerPublic);

router.use(protect);

router.post('/profile', requireRole('worker'), workerController.upsertProfile);
router.put('/profile', requireRole('worker'), workerController.upsertProfile);
router.get('/profile/me', requireRole('worker'), workerController.getMyProfile);

module.exports = router;
