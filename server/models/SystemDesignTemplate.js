const mongoose = require('mongoose');

const systemDesignTemplateSchema = new mongoose.Schema({
  problemType: { type: String, required: true },
  framework: { type: String },
  keyComponents: [{ type: String }],
  commonMistakes: [{ type: String }],
  estimatedTime: { type: Number },
  difficulty: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemDesignTemplate', systemDesignTemplateSchema);
