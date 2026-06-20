const Play = require('../models/Play');
const PlayUsage = require('../models/PlayUsage');
const SavedPlay = require('../models/SavedPlay');

exports.getPlays = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    let query = { isApproved: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { playName: { $regex: search, $options: 'i' } },
        { theInsight: { $regex: search, $options: 'i' } }
      ];
    }

    const plays = await Play.find(query).sort({ impactScore: -1 });
    
    // Add isSaved and hasUsed flags
    const savedPlays = await SavedPlay.find({ userId: req.user._id }).select('playId');
    const usedPlays = await PlayUsage.find({ userId: req.user._id }).select('playId');
    
    const savedPlayIds = savedPlays.map(sp => sp.playId.toString());
    const usedPlayIds = usedPlays.map(up => up.playId.toString());

    const playsWithFlags = plays.map(play => {
      const playObj = play.toObject();
      playObj.isSaved = savedPlayIds.includes(play._id.toString());
      playObj.hasUsed = usedPlayIds.includes(play._id.toString());
      return playObj;
    });

    res.json(playsWithFlags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPlay = async (req, res) => {
  try {
    const play = await Play.findById(req.params.id);
    if (!play) return res.status(404).json({ error: 'Play not found' });
    
    const isSaved = await SavedPlay.exists({ userId: req.user._id, playId: play._id });
    const usageHistory = await PlayUsage.find({ userId: req.user._id, playId: play._id }).sort({ usedAt: -1 });

    res.json({
      ...play.toObject(),
      isSaved: !!isSaved,
      hasUsed: usageHistory.length > 0,
      usageHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.savePlay = async (req, res) => {
  try {
    const playId = req.params.id;
    await SavedPlay.findOneAndUpdate(
      { userId: req.user._id, playId },
      { userId: req.user._id, playId },
      { upsert: true, new: true }
    );
    await Play.findByIdAndUpdate(playId, { $inc: { savedByCount: 1 } });
    res.json({ message: 'Play saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unsavePlay = async (req, res) => {
  try {
    const playId = req.params.id;
    const result = await SavedPlay.findOneAndDelete({ userId: req.user._id, playId });
    if (result) {
      await Play.findByIdAndUpdate(playId, { $inc: { savedByCount: -1 } });
    }
    res.json({ message: 'Play removed from saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logUsage = async (req, res) => {
  try {
    const playId = req.params.id;
    const { contactId, notes } = req.body;
    
    const usage = new PlayUsage({
      userId: req.user._id,
      playId,
      contactId,
      notes
    });
    
    await usage.save();
    await Play.findByIdAndUpdate(playId, { $inc: { usageCount: 1 } });
    
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUsage = async (req, res) => {
  try {
    const { outcome, notes } = req.body;
    const usage = await PlayUsage.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { outcome, notes },
      { new: true }
    );
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSavedPlays = async (req, res) => {
  try {
    const savedPlays = await SavedPlay.find({ userId: req.user._id }).populate('playId');
    res.json(savedPlays.map(sp => sp.playId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitCommunityPlay = async (req, res) => {
  try {
    const playData = {
      ...req.body,
      contributedBy: 'StudentTracker Community',
      isApproved: false // Needs admin approval
    };
    const newPlay = new Play(playData);
    await newPlay.save();
    res.json({ message: 'Play submitted for review', play: newPlay });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getContextualPlays = async (req, res) => {
  try {
    // In a real implementation, this would look at the user's timeline phase, weak points, etc.
    // For now, we return 3 highly impactful plays across different categories.
    const plays = await Play.find({ isApproved: true })
      .sort({ impactScore: -1 })
      .limit(10);
    
    // Select 3 diverse plays for context
    const contextualPlays = plays.slice(0, 3).map((play, index) => {
      let reason = "Recommended to improve your outreach response rate.";
      if (index === 1) reason = "Highly effective strategy for your current network phase.";
      if (index === 2) reason = "You have 3 weak relationships this could help activate.";
      return { play, reason };
    });
    
    res.json(contextualPlays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
