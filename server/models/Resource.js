const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  category: { type: String, required: true }, // DSA, Web Dev, System Design, CS Core, Interview Prep
  difficulty: { type: String, required: true }, // Beginner, Intermediate, Advanced
  icon: { type: String, required: true }, // Code, Monitor, Server, Database, Briefcase
  isPublished: {
    type: Boolean,
    default: true
  },
  // V7 Patches
  estimatedHours: { type: Number, default: 0 },
  lastCheckedAt: { type: Date },
  isAlive: { type: Boolean, default: true },
  reportedBroken: { type: Boolean, default: false },
  lastVerifiedAt: { type: Date },
  contentYear: { type: Number },
  isStale: { type: Boolean, default: false },
  language: { type: String, default: "English" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resource', resourceSchema);
