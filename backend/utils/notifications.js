const Notification = require('../models/Notification');

async function createNotification(userId, message, type) {
  return Notification.create({ userId, message, type });
}

module.exports = { createNotification };
