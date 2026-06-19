const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, date, type, description, emailReminder } = req.body;
    const event = await Event.create({
      user: req.user._id,
      title,
      date,
      type,
      description,
      emailReminder
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.scheduleResumeRevamp = async (req, res) => {
  try {
    const { resumeName } = req.body;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    const event = await Event.create({
      user: req.user._id,
      title: `Resume Revamp: ${resumeName || 'General'}`,
      date: targetDate,
      type: 'Other',
      description: 'Your resume health is declining or stale. Take some time to revamp it.',
      emailReminder: true
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
