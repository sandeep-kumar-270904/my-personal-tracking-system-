const mongoose = require('mongoose');
require('dotenv').config();
const Badge = require('./models/Badge');
const connectDB = require('./config/db');

const badges = [
  // COMPLETION
  { key: 'first_step', name: 'First Step', description: 'Complete your first resource', emoji: '🎯', category: 'completion' },
  { key: 'on_a_roll', name: 'On A Roll', description: 'Complete 5 resources', emoji: '🚀', category: 'completion' },
  { key: 'halfway_there', name: 'Halfway There', description: 'Complete 10 resources', emoji: '💪', category: 'completion' },
  { key: 'resource_master', name: 'Resource Master', description: 'Complete all resources in any one category', emoji: '🏆', category: 'completion' },
  { key: 'prephub_legend', name: 'PrepHub Legend', description: 'Complete 25 resources total', emoji: '👑', category: 'completion' },
  // STREAK
  { key: '3_day_warrior', name: '3 Day Warrior', description: 'Maintain a 3 day streak', emoji: '⚡', category: 'streak' },
  { key: 'week_warrior', name: 'Week Warrior', description: 'Maintain a 7 day streak', emoji: '🗓️', category: 'streak' },
  { key: 'unstoppable', name: 'Unstoppable', description: 'Maintain a 30 day streak', emoji: '🔥', category: 'streak' },
  // CONTRIBUTION
  { key: 'first_upvote', name: 'First Upvote', description: 'Upvote your first resource', emoji: '👍', category: 'contribution' },
  { key: 'helpful_voice', name: 'Helpful Voice', description: 'Leave your first review', emoji: '💬', category: 'contribution' },
  { key: 'community_builder', name: 'Community Builder', description: 'Submit a resource that gets approved', emoji: '🌟', category: 'contribution' },
  // DISCOVERY
  {
    key: 'explorer',
    name: 'Explorer',
    description: 'Completed resources in at least 3 different categories.',
    emoji: '🧭',
    category: 'discovery'
  },
  {
    key: 'well_rounded',
    name: 'Well Rounded',
    description: 'Completed at least one resource in all major categories.',
    emoji: '🎯',
    category: 'discovery'
  },
  // V5 Badges
  {
    key: 'collector',
    name: 'Collector',
    description: 'Enrolled in your first Collection.',
    emoji: '📋',
    category: 'discovery'
  },
  {
    key: 'course_complete',
    name: 'Course Complete',
    description: 'Completed all resources in any Collection.',
    emoji: '🎓',
    category: 'completion'
  },
  {
    key: 'team_player',
    name: 'Team Player',
    description: 'Completed a weekly group challenge with your study group.',
    emoji: '🤝',
    category: 'contribution'
  },
  {
    key: 'squad_leader',
    name: 'Squad Leader',
    description: 'Created a study group and became a leader.',
    emoji: '👑',
    category: 'contribution'
  }
];

const seedBadges = async () => {
  try {
    await connectDB();
    for (const badge of badges) {
      await Badge.findOneAndUpdate({ key: badge.key }, badge, { upsert: true, new: true });
    }
    console.log('Badges seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedBadges();
