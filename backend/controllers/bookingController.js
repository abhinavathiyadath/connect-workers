const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

function normalizeTimeSlot(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    // Normalize dash variants to en-dash so comparisons match.
    .replace(/[–—-]/g, '–');
}

exports.createBooking = async (req, res) => {
  try {
    const { workerUserId, date, timeSlot } = req.body;
    if (!workerUserId || !date || !timeSlot) {
      return res.status(400).json({ message: 'workerUserId, date, and timeSlot required' });
    }

    const workerProfile = await WorkerProfile.findOne({
      userId: workerUserId,
      isApproved: true,
    });
    if (!workerProfile) {
      return res.status(400).json({ message: 'Worker not available' });
    }

    // Validate time slot and prevent double-booking.
    // Note: Frontend sends exactly one of `workerProfile.availabilitySlots`.
    // Parse YYYY-MM-DD as an explicit UTC day boundary to avoid timezone drift.
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const requestedSlot = normalizeTimeSlot(timeSlot);
    const workerSlotsNormalized = (workerProfile.availabilitySlots || []).map(normalizeTimeSlot);

    if (!workerSlotsNormalized.includes(requestedSlot)) {
      return res.status(400).json({ message: 'This time slot is not available for the worker' });
    }

    const existing = await Booking.findOne({
      workerId: workerUserId,
      date: { $gte: dayStart, $lt: dayEnd },
      timeSlot: requestedSlot,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      workerId: workerUserId,
      date: dayStart,
      timeSlot: requestedSlot,
      status: 'pending',
    });

    const customer = await User.findById(req.user._id).select('name');
    await createNotification(
      workerUserId,
      `${customer?.name || 'A customer'} requested a booking on ${new Date(date).toLocaleDateString()} (${requestedSlot}).`,
      'booking'
    );

    const populated = await Booking.findById(booking._id)
      .populate('customerId', 'name email')
      .populate('workerId', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyCustomerBookings = async (req, res) => {
  try {
    const list = await Booking.find({ customerId: req.user._id })
      .populate('workerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyWorkerBookings = async (req, res) => {
  try {
    const list = await Booking.find({ workerId: req.user._id })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.workerId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking cannot be accepted' });
    }
    booking.status = 'confirmed';
    await booking.save();

    await createNotification(
      booking.customerId,
      'Your booking was accepted by the worker.',
      'booking'
    );

    const populated = await Booking.findById(booking._id)
      .populate('customerId', 'name email')
      .populate('workerId', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.workerId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking cannot be rejected' });
    }
    booking.status = 'rejected';
    await booking.save();

    await createNotification(
      booking.customerId,
      'Your booking request was rejected.',
      'booking'
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.workerId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be completed' });
    }
    booking.status = 'completed';
    await booking.save();

    await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalBookings: 1 } }
    );

    await createNotification(
      booking.customerId,
      'Your service was marked completed. Please leave a rating!',
      'booking'
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rateBooking = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ message: 'Rating must be 1–5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.customerId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed bookings' });
    }
    if (booking.rating != null) {
      return res.status(400).json({ message: 'Already rated' });
    }

    booking.rating = r;
    booking.review = review || '';
    await booking.save();

    const profile = await WorkerProfile.findOne({ userId: booking.workerId });
    if (profile) {
      const total = profile.totalRatings || 0;
      const oldAvg = profile.rating || 0;
      const newTotal = total + 1;
      const newAvg = (oldAvg * total + r) / newTotal;
      profile.rating = Math.round(newAvg * 10) / 10;
      profile.totalRatings = newTotal;
      await profile.save();
    }

    await createNotification(
      booking.workerId,
      `You received a ${r}-star rating from a customer.`,
      'rating'
    );

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBookedSlots = async (req, res) => {
  try {
    const { workerUserId, date } = req.query;
    if (!workerUserId || !date) {
      return res.status(400).json({ message: 'workerUserId and date required' });
    }

    // Parse YYYY-MM-DD as an explicit UTC day boundary to avoid timezone drift.
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const bookings = await Booking.find(
      {
        workerId: workerUserId,
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $in: ['pending', 'confirmed'] },
      },
      { timeSlot: 1, _id: 0 }
    ).lean();

    const bookedTimeSlots = [...new Set(bookings.map((b) => normalizeTimeSlot(b.timeSlot)).filter(Boolean))];
    res.json({ bookedTimeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
