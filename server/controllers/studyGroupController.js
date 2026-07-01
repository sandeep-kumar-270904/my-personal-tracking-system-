const StudyGroup = require('../models/StudyGroup');
const StudyGroupMember = require('../models/StudyGroupMember');
const WeeklyChallenge = require('../models/WeeklyChallenge');
const WeeklyChallengeCompletion = require('../models/WeeklyChallengeCompletion');
const gamificationService = require('../services/gamificationService');
const crypto = require('crypto');

const createGroup = async (req, res) => {
  try {
    const { groupName, isPublic } = req.body;
    const userId = req.user.id;

    // Generate short random invite code
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const group = await StudyGroup.create({
      groupName,
      inviteCode,
      createdBy: userId,
      isPublic: isPublic || false
    });

    // Add creator as member
    await StudyGroupMember.create({
      groupId: group._id,
      userId,
      displayName: req.user.name || 'Member'
    });

    // Check squad leader badge
    gamificationService.checkAndAwardBadges(userId).catch(console.error);

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const group = await StudyGroup.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Invalid invite code' });

    const existing = await StudyGroupMember.findOne({ groupId: group._id, userId });
    if (existing) return res.status(400).json({ message: 'Already a member' });

    await StudyGroupMember.create({
      groupId: group._id,
      userId,
      displayName: req.user.name || 'Member'
    });

    res.json({ message: 'Joined successfully', groupId: group._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await StudyGroupMember.find({ userId }).populate('groupId');
    
    // Format response
    const groups = await Promise.all(memberships.map(async m => {
      const group = m.groupId;
      if (!group) return null;
      
      const memberCount = await StudyGroupMember.countDocuments({ groupId: group._id });
      return {
        id: group._id,
        groupName: group.groupName,
        inviteCode: group.inviteCode,
        isPublic: group.isPublic,
        memberCount,
        role: group.createdBy.toString() === userId ? 'leader' : 'member'
      };
    }));

    res.json(groups.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await StudyGroup.findById(id).populate('createdBy', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const members = await StudyGroupMember.find({ groupId: id }).populate('userId', 'name profilePic');
    
    // Find active weekly challenge
    const now = new Date();
    const challenge = await WeeklyChallenge.findOne({
      groupId: id,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('resourceId');

    let challengeData = null;
    if (challenge) {
      const completions = await WeeklyChallengeCompletion.find({ challengeId: challenge._id }).populate('userId', 'name');
      const hasCompleted = completions.some(c => c.userId._id.toString() === req.user.id);
      
      challengeData = {
        id: challenge._id,
        resource: challenge.resourceId,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        requiredCompletions: challenge.requiredCompletions,
        currentCompletions: completions.length,
        hasCompleted,
        completions: completions.map(c => ({
          userId: c.userId._id,
          name: c.userId.name,
          completedAt: c.completedAt
        }))
      };
    }

    res.json({
      id: group._id,
      groupName: group.groupName,
      inviteCode: group.inviteCode,
      leader: group.createdBy,
      members: members.map(m => ({ id: m.userId?._id, name: m.userId?.name, joinedAt: m.joinedAt })),
      activeChallenge: challengeData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createWeeklyChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { resourceId, requiredCompletions } = req.body;
    
    const group = await StudyGroup.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Only leader can create challenge
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7);

    const challenge = await WeeklyChallenge.create({
      groupId: id,
      resourceId,
      startDate: now,
      endDate,
      requiredCompletions: requiredCompletions || 1
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const completeChallenge = async (req, res) => {
  try {
    const { id, challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await WeeklyChallenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const existing = await WeeklyChallengeCompletion.findOne({ challengeId, userId });
    if (existing) return res.status(400).json({ message: 'Already completed' });

    await WeeklyChallengeCompletion.create({ challengeId, userId });

    // Try to award "Team Player" badge
    gamificationService.checkAndAwardBadges(userId).catch(console.error);

    res.json({ message: 'Challenge completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  getMyGroups,
  getGroupDetails,
  createWeeklyChallenge,
  completeChallenge
};
