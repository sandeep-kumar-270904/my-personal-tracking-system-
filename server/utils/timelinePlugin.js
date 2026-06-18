const UnifiedTimeline = require('../models/UnifiedTimeline');

const getModelConfig = (modelName) => {
  const configs = {
    'Application': { sourceTable: 'APPLICATION', titleField: 'company' },
    'Interview': { sourceTable: 'INTERVIEW', titleField: 'company' },
    'DSA': { sourceTable: 'DSA', titleField: 'topic' },
    'Network': { sourceTable: 'CONTACT', titleField: 'name' },
    'Offer': { sourceTable: 'OFFER', titleField: 'company' },
    'Contest': { sourceTable: 'CONTEST', titleField: 'platform' },
    'Resume': { sourceTable: 'RESUME', titleField: 'name' },
    'Goal': { sourceTable: 'GOAL', titleField: 'type' }
  };
  return configs[modelName];
};

module.exports = function timelinePlugin(schema, options) {
  schema.post('save', async function (doc) {
    try {
      const config = getModelConfig(doc.constructor.modelName);
      if (!config) return;

      const isNew = !doc.isNew && doc.$locals && doc.$locals.wasNew; 
      // Mongoose post('save') doesn't have isNew. A common pattern is to set it in pre('save').
      // Alternatively we can just check if createdAt === updatedAt or similar.
      
      const eventType = doc.createdAt && doc.updatedAt && doc.createdAt.getTime() === doc.updatedAt.getTime() ? 'CREATED' : 'UPDATED';
      
      let title = `[${config.sourceTable}] ${eventType}`;
      if (doc[config.titleField]) {
        title = `${doc[config.titleField]} ${eventType.toLowerCase()}`;
      }

      await UnifiedTimeline.create({
        userId: doc.userId,
        sourceTable: config.sourceTable,
        sourceId: doc._id,
        eventType,
        title,
        metadata: {
          modelName: doc.constructor.modelName
        }
      });
    } catch (err) {
      console.error('Error in timeline plugin:', err);
    }
  });

  // Also support findOneAndUpdate if needed, but the prompt says "fires on every create and update".
  // Mongoose middleware for findOneAndUpdate is tricky because `this` is the query, not the doc.
  // We can hook into post('findOneAndUpdate')
  schema.post('findOneAndUpdate', async function (doc) {
    if (!doc) return;
    try {
      const config = getModelConfig(doc.constructor.modelName);
      if (!config) return;

      let title = `[${config.sourceTable}] UPDATED`;
      if (doc[config.titleField]) {
        title = `${doc[config.titleField]} updated`;
      }

      await UnifiedTimeline.create({
        userId: doc.userId,
        sourceTable: config.sourceTable,
        sourceId: doc._id,
        eventType: 'UPDATED',
        title,
        metadata: {
          modelName: doc.constructor.modelName
        }
      });
    } catch (err) {
      console.error('Error in timeline plugin findOneAndUpdate:', err);
    }
  });
};
