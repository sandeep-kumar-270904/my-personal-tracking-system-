const User = require('../models/User');
const ResourceCompletion = require('../models/ResourceCompletion');
const Application = require('../models/Application');
const DSA = require('../models/DSA');
const StudentInsightCache = require('../models/StudentInsightCache');
const gamificationService = require('./gamificationService');

/**
 * Called when a student completes a resource.
 */
async function onResourceCompleted(userId, resourceId) {
  try {
    // Invalidate insights cache so dashboard/stats update immediately
    await StudentInsightCache.findOneAndUpdate(
      { userId },
      { lastUpdated: new Date(0) } // force stale
    );

    // Re-check gamification badges
    await gamificationService.checkAndAwardBadges(userId);

    // Additional sync tasks can be added here
    // e.g. recalculate application prep scores if we cache them
    
  } catch (error) {
    console.error('Error in prepHubSyncService.onResourceCompleted:', error);
  }
}

/**
 * Called when a student logs an interview result.
 */
async function onInterviewLogged(userId, interviewId) {
  try {
    // Invalidate recommendation cache so AI generates new picks based on gaps
    await User.findByIdAndUpdate(userId, {
      $set: { 'aiInsightsCache.generatedAt': new Date(0) }
    });

    // We can also trigger a background process here to parse feedback
    // and generate a specific InterviewGapAlert if rejected.
  } catch (error) {
    console.error('Error in prepHubSyncService.onInterviewLogged:', error);
  }
}

/**
 * Called when a student adds a new job application.
 */
async function onApplicationAdded(userId, applicationId) {
  try {
    // Invalidate recommendation cache so it incorporates the new target company
    await User.findByIdAndUpdate(userId, {
      $set: { 'aiInsightsCache.generatedAt': new Date(0) }
    });
  } catch (error) {
    console.error('Error in prepHubSyncService.onApplicationAdded:', error);
  }
}

/**
 * Called when an AI Analyzer report is generated.
 */
async function onAIAnalyzerReport(userId, reportId) {
  try {
    // Invalidate recommendation cache to factor in new AI findings
    await User.findByIdAndUpdate(userId, {
      $set: { 'aiInsightsCache.generatedAt': new Date(0) }
    });
  } catch (error) {
    console.error('Error in prepHubSyncService.onAIAnalyzerReport:', error);
  }
}

module.exports = {
  onResourceCompleted,
  onInterviewLogged,
  onApplicationAdded,
  onAIAnalyzerReport
};
