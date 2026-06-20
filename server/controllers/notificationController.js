const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

const Event = require('../models/Event');
const { localTimeToUTC, utcToLocalTime } = require('./eventController');

const handleNotificationAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'mark_sent' | 'add_reminder' | 'dismiss'

    const notification = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    if (action === 'mark_sent' && notification.eventId) {
      const event = await Event.findById(notification.eventId);
      if (event) {
        event.status = 'completed';
        await event.save();
      }
    } else if (action === 'add_reminder' && notification.eventId) {
      const event = await Event.findById(notification.eventId);
      if (event) {
        const cleanCompany = event.title.replace(/Interview:?/gi, '').trim();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const userTimezone = req.user.calendarSettings?.timezone || 'Asia/Kolkata';

        const tomorrowStart = localTimeToUTC(tomorrow.toISOString().split('T')[0], '09:00', userTimezone);
        const tomorrowEnd = new Date(tomorrowStart.getTime() + 30 * 60000);

        const startInfo = utcToLocalTime(tomorrowStart, 'UTC');
        const endInfo = utcToLocalTime(tomorrowEnd, 'UTC');

        await Event.create({
          user: req.user._id,
          title: `Follow-up: Thank-you to ${cleanCompany}`,
          date: new Date(startInfo.dateStr + 'T00:00:00.000Z'),
          start_time: startInfo.timeStr,
          end_time: endInfo.timeStr,
          is_all_day: false,
          type: 'follow_up',
          source: 'manual',
          status: 'upcoming',
          timezone: userTimezone
        });
      }
    }

    res.json({ message: 'Notification action completed successfully', notification });
  } catch (error) {
    console.error('Error handling notification action:', error);
    res.status(500).json({ message: 'Server error handling notification action' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  handleNotificationAction
};
