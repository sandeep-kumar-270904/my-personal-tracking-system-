const User = require('../models/User');
const StudentFollow = require('../models/StudentFollow');
const ActivityFeed = require('../models/ActivityFeed');
const ResourceCompletion = require('../models/ResourceCompletion');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

const followStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (studentId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const existingFollow = await StudentFollow.findOne({ follower: req.user._id, following: studentId });
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this student' });
    }

    await StudentFollow.create({ follower: req.user._id, following: studentId });
    res.status(200).json({ message: 'Successfully followed student' });
  } catch (error) {
    res.status(500).json({ message: 'Error following student', error: error.message });
  }
};

const unfollowStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    await StudentFollow.findOneAndDelete({ follower: req.user._id, following: studentId });
    res.status(200).json({ message: 'Successfully unfollowed student' });
  } catch (error) {
    res.status(500).json({ message: 'Error unfollowing student', error: error.message });
  }
};

const getActivityFeed = async (req, res) => {
  try {
    // Get all users the current user is following
    const follows = await StudentFollow.find({ follower: req.user._id });
    const followingIds = follows.map(f => f.following);

    // Include the user's own activity as well
    followingIds.push(req.user._id);

    const feed = await ActivityFeed.find({ user: { $in: followingIds } })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(feed);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity feed', error: error.message });
  }
};

const getProfileData = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const user = await User.findById(studentId).select('name email profilePicture bio github linkedin isBanned');
    if (!user || user.isBanned) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followersCount = await StudentFollow.countDocuments({ following: studentId });
    const followingCount = await StudentFollow.countDocuments({ follower: studentId });
    
    const isFollowing = await StudentFollow.exists({ follower: req.user._id, following: studentId });

    const recentActivity = await ActivityFeed.find({ user: studentId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Aggregate some stats
    const resourcesCompleted = await ResourceCompletion.countDocuments({ user: studentId });
    const applicationsLogged = await Application.countDocuments({ user: studentId });
    const interviewsLogged = await Interview.countDocuments({ user: studentId });

    res.status(200).json({
      user,
      stats: {
        followers: followersCount,
        following: followingCount,
        resourcesCompleted,
        applicationsLogged,
        interviewsLogged
      },
      isFollowing: !!isFollowing,
      recentActivity
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile data', error: error.message });
  }
};

module.exports = {
  followStudent,
  unfollowStudent,
  getActivityFeed,
  getProfileData
};
