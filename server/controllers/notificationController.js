const Notification = require('../models/notification');
const mongoose = require('mongoose');

const getNotifications = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

module.exports = { getNotifications, markAsRead };