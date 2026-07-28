const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notifications');

/**
 * Create a customer or worker account (admin only; role cannot be admin).
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const r = role === 'worker' ? 'worker' : 'customer';
    if (role === 'admin') {
      return res.status(400).json({ message: 'Cannot create admin accounts via this route' });
    }
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      password: hashed,
      role: r,
    });
    const out = user.toObject();
    delete out.password;
    res.status(201).json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Remove a user (customer or worker). Deletes profile, bookings, and notifications.
 * Admins and self cannot be removed.
 */
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    if (target.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be deleted' });
    }

    await Booking.deleteMany({
      $or: [{ customerId: target._id }, { workerId: target._id }],
    });
    await WorkerProfile.deleteMany({ userId: target._id });
    await Notification.deleteMany({ userId: target._id });
    await User.findByIdAndDelete(id);

    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingWorkers = async (req, res) => {
  try {
    const profiles = await WorkerProfile.find({ isApproved: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setWorkerApproval = async (req, res) => {
  try {
    const { approved } = req.body;
    const profile = await WorkerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.isApproved = Boolean(approved);
    await profile.save();

    await createNotification(
      profile.userId,
      approved
        ? 'Your worker profile was approved. You are now visible to customers.'
        : 'Your worker profile was not approved.',
      'approval'
    );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const list = await Booking.find()
      .populate('customerId', 'name email')
      .populate('workerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const approvedWorkers = await WorkerProfile.countDocuments({ isApproved: true });
    const totalBookings = await Booking.countDocuments();

    const bookingsByWorker = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$workerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const workerIds = bookingsByWorker.map((b) => b._id);
    const workerUsers = await User.find({ _id: { $in: workerIds } }).select('name');
    const nameMap = Object.fromEntries(workerUsers.map((u) => [String(u._id), u.name]));

    const mostBooked = bookingsByWorker.map((b) => ({
      workerId: b._id,
      workerName: nameMap[String(b._id)] || 'Unknown',
      bookings: b.count,
    }));

    const ratingStats = await WorkerProfile.find({ isApproved: true })
      .select('skill rating totalRatings userId')
      .populate('userId', 'name')
      .lean();

    const averageRatingPerWorker = ratingStats.map((p) => ({
      workerName: p.userId?.name || 'Worker',
      skill: p.skill,
      averageRating: p.rating || 0,
      totalRatings: p.totalRatings || 0,
    }));

    res.json({
      totalUsers,
      totalWorkers,
      approvedWorkers,
      totalBookings,
      mostBookedWorkers: mostBooked,
      averageRatingPerWorker,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
