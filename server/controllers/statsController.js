const StudentInsightCache = require('../models/StudentInsightCache');
const ResourceCompletion = require('../models/ResourceCompletion');
const Resource = require('../models/Resource');
// Prisma client for applications and DSA
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const forceRefresh = req.query.refresh === 'true';

    let cache = await StudentInsightCache.findOne({ userId });

    // Refresh if forced, or if cache is older than 6 hours, or doesn't exist
    const isStale = cache && (new Date() - cache.lastUpdated > 6 * 60 * 60 * 1000);

    if (!cache || isStale || forceRefresh) {
      // 1. Gather Resource Completions
      const completions = await ResourceCompletion.find({ userId }).populate('resourceId');
      const totalCompletions = completions.length;
      
      const categoryMap = {};
      const activityMap = {};

      completions.forEach(c => {
        // Categories
        if (c.resourceId) {
          const cat = c.resourceId.category;
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        }

        // Activity Date
        const dateStr = new Date(c.completedAt).toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      });

      // 2. Gather Applications (Prisma)
      let applicationsSubmitted = 0;
      try {
        const apps = await prisma.application.count({
          where: { userId }
        });
        applicationsSubmitted = apps;
      } catch (err) {
        console.warn("Prisma error counting applications:", err.message);
      }

      // 3. Gather DSA Solved (Prisma)
      let dsaSolved = 0;
      try {
        const dsas = await prisma.userDsaProgress.count({
          where: { userId, status: 'SOLVED' }
        });
        dsaSolved = dsas;
      } catch (err) {
        console.warn("Prisma error counting DSA progress:", err.message);
      }

      // Formatting
      const categoryBreakdown = Object.keys(categoryMap).map(k => ({
        category: k, count: categoryMap[k]
      }));

      const activityHeatmap = Object.keys(activityMap).map(k => ({
        date: k, count: activityMap[k]
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      const newData = {
        totalCompletions,
        applicationsSubmitted,
        dsaSolved,
        streak: 0, // Placeholder
        categoryBreakdown,
        activityHeatmap
      };

      if (cache) {
        cache.data = newData;
        cache.lastUpdated = new Date();
        await cache.save();
      } else {
        cache = await StudentInsightCache.create({
          userId,
          data: newData
        });
      }
    }

    res.json(cache.data);
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getMyStats
};
