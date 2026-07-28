const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { scoreAndSortWorkers } = require('../utils/recommendation');

/**
 * Create or update worker profile (worker role).
 */
exports.upsertProfile = async (req, res) => {
  try {
    const { skill, village, location, price, availabilitySlots } = req.body;
    if (!skill || location == null || price == null) {
      return res
        .status(400)
        .json({ message: 'skill, location, and price are required' });
    }
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        skill,
        village: village || '',
        location: { lat, lng },
        price: Number(price),
        availabilitySlots: Array.isArray(availabilitySlots)
          ? availabilitySlots
          : [],
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'No profile yet' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/workers/recommended
 * Query: lat, lng, skill (optional), village (optional)
 * Returns approved workers with recommendation scores.
 */
exports.getRecommended = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params required' });
    }

    const filter = { isApproved: true };
    if (req.query.skill && String(req.query.skill).trim()) {
      filter.skill = new RegExp(String(req.query.skill).trim(), 'i');
    }
    if (req.query.village && String(req.query.village).trim()) {
      filter.village = new RegExp(String(req.query.village).trim(), 'i');
    }

    const profiles = await WorkerProfile.find(filter).lean();
    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email')
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

    const withNames = profiles.map((p) => ({
      ...p,
      workerName: userMap[String(p.userId)]?.name || 'Worker',
      workerEmail: userMap[String(p.userId)]?.email,
    }));

    const scored = scoreAndSortWorkers(withNames, lat, lng);
    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getWorkerPublic = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({
      userId: req.params.userId,
      isApproved: true,
    }).lean();
    if (!profile) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    const user = await User.findById(req.params.userId).select('name email');
    res.json({ ...profile, workerName: user?.name, workerEmail: user?.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
