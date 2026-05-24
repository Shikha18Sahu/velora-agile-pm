const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getNotifications);

router.route('/:id/read')
  .put(protect, markAsRead);

module.exports = router;
