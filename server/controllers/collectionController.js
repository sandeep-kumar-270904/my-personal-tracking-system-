const Collection = require('../models/Collection');
const ResourceCompletion = require('../models/ResourceCompletion');
const gamificationService = require('../services/gamificationService');

const getCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const collections = await Collection.find({ isPublished: true })
      .populate('items.resourceId', 'title difficulty category icon estimatedHours');

    // Fetch user completions to calculate progress
    const completions = await ResourceCompletion.find({ userId });
    const completedResourceIds = new Set(completions.map(c => c.resourceId.toString()));

    const result = collections.map(col => {
      const isEnrolled = col.enrollments.some(e => e.userId.toString() === userId);
      const totalResources = col.items.length;
      const completedResources = col.items.filter(item => completedResourceIds.has(item.resourceId?._id?.toString())).length;

      const totalHours = col.items.reduce((sum, item) => sum + (item.resourceId?.estimatedHours || 0), 0);
      return {
        id: col._id,
        name: col.name,
        tagline: col.tagline,
        estimatedTime: totalHours > 0 ? `${col.estimatedTime} (~${totalHours}h)` : col.estimatedTime,
        resourceCount: totalResources,
        enrolledCount: col.enrollments.length,
        isEnrolled,
        progress: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
        completedCount: completedResources,
        // Calculate difficulty range
        difficulties: [...new Set(col.items.map(item => item.resourceId?.difficulty).filter(Boolean))]
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getCollectionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const collection = await Collection.findById(req.params.id)
      .populate('items.resourceId', 'title description category difficulty icon url estimatedHours');

    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const completions = await ResourceCompletion.find({ userId });
    const completedResourceIds = new Set(completions.map(c => c.resourceId.toString()));

    const isEnrolled = collection.enrollments.some(e => e.userId.toString() === userId);
    
    // Sort items by order
    const sortedItems = collection.items.sort((a, b) => a.order - b.order).map(item => ({
      ...item.toObject(),
      hasCompleted: completedResourceIds.has(item.resourceId?._id?.toString())
    }));

    const totalHours = collection.items.reduce((sum, item) => sum + (item.resourceId?.estimatedHours || 0), 0);

    res.json({
      id: collection._id,
      name: collection.name,
      tagline: collection.tagline,
      estimatedTime: totalHours > 0 ? `${collection.estimatedTime} (~${totalHours}h)` : collection.estimatedTime,
      enrolledCount: collection.enrollments.length,
      isEnrolled,
      items: sortedItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const enrollCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const enrollmentIndex = collection.enrollments.findIndex(e => e.userId.toString() === userId);
    
    if (enrollmentIndex > -1) {
      // Unenroll
      collection.enrollments.splice(enrollmentIndex, 1);
      await collection.save();
      res.json({ message: 'Unenrolled', isEnrolled: false });
    } else {
      // Enroll
      collection.enrollments.push({ userId });
      await collection.save();
      
      // Async gamification check (Collector badge)
      gamificationService.checkAndAwardBadges(userId).catch(console.error);

      res.json({ message: 'Enrolled successfully', isEnrolled: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin Routes
const getAdminCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 })
      .populate('items.resourceId', 'title category difficulty estimatedHours');
      
    const result = collections.map(c => {
      const totalHours = c.items.reduce((sum, item) => sum + (item.resourceId?.estimatedHours || 0), 0);
      return {
        id: c._id,
        name: c.name,
        tagline: c.tagline,
        estimatedTime: totalHours > 0 ? `${c.estimatedTime} (~${totalHours}h)` : c.estimatedTime,
        isPublished: c.isPublished,
        resourceCount: c.items.length,
        enrolledCount: c.enrollments.length,
        items: c.items.sort((a,b) => a.order - b.order)
      };
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const createCollection = async (req, res) => {
  try {
    const { name, tagline, estimatedTime } = req.body;
    const collection = await Collection.create({ name, tagline, estimatedTime, items: [], enrollments: [] });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateCollection = async (req, res) => {
  try {
    const { name, tagline, estimatedTime, isPublished } = req.body;
    const collection = await Collection.findByIdAndUpdate(
      req.params.id, 
      { name, tagline, estimatedTime, isPublished },
      { new: true }
    );
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateCollectionItems = async (req, res) => {
  try {
    const { items } = req.body; // Expects [{ resourceId, order }]
    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      { items },
      { new: true }
    );
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteCollection = async (req, res) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getCollections,
  getCollectionById,
  enrollCollection,
  getAdminCollections,
  createCollection,
  updateCollection,
  updateCollectionItems,
  deleteCollection
};
