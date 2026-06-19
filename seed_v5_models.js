const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'server', 'models');

const files = {
  'ConceptModule.js': `const mongoose = require('mongoose');
const conceptModuleSchema = new mongoose.Schema({
  topicOrPattern: { type: String, required: true },
  title: { type: String, required: true },
  realWorldAnalogy: { type: String, required: true },
  coreInsight: { type: String, required: true },
  minimalExample: { type: String, required: true },
  template: { type: String, required: true },
  microProblemQuestion: { type: String, required: true },
  microProblemAnswer: { type: String, required: true },
  orderIndex: { type: Number, required: true },
  prerequisites: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ConceptModule', conceptModuleSchema);`,

  'StudentConceptProgress.js': `const mongoose = require('mongoose');
const studentConceptProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConceptModule', required: true },
  status: { type: String, enum: ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED'], default: 'LOCKED' },
  completedAt: { type: Date },
  microProblemAttempts: { type: Number, default: 0 },
  microProblemPassed: { type: Boolean, default: false },
  analogyRating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('StudentConceptProgress', studentConceptProgressSchema);`,

  'ThinkingVelocity.js': `const mongoose = require('mongoose');
const thinkingVelocitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  topic: { type: String },
  pattern: { type: String },
  timeToFirstCorrectApproach: { type: Number },
  wasApproachCorrect: { type: Boolean },
  pressureMode: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ThinkingVelocity', thinkingVelocitySchema);`,

  'BlindImplementation.js': `const mongoose = require('mongoose');
const blindImplementationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA', required: true },
  attemptedAt: { type: Date, default: Date.now },
  studentCode: { type: String },
  gotStuck: { type: Boolean },
  stuckPoint: { type: String },
  lookedAnythingUp: { type: Boolean },
  completedAt: { type: Date }
});
module.exports = mongoose.model('BlindImplementation', blindImplementationSchema);`,

  'ORCAFramework.js': `const mongoose = require('mongoose');
const orcaFrameworkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  observe: { type: String },
  recognize: { type: String },
  consider: { type: String },
  attack: { type: String },
  submittedAt: { type: Date, default: Date.now },
  wasHelpful: { type: Boolean }
});
module.exports = mongoose.model('ORCAFramework', orcaFrameworkSchema);`,

  'RubberDuckExplanation.js': `const mongoose = require('mongoose');
const rubberDuckExplanationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  explanation: { type: String },
  communicationScore: { type: Number, min: 0, max: 100 },
  intuitionExplained: { type: Boolean },
  complexityMentioned: { type: Boolean },
  edgeCasesCovered: { type: Boolean },
  aiFeedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('RubberDuckExplanation', rubberDuckExplanationSchema);`,

  'SolutionQualityEval.js': `const mongoose = require('mongoose');
const solutionQualityEvalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  solutionCode: { type: String },
  correctnessScore: { type: Number, min: 0, max: 100 },
  efficiencyScore: { type: Number, min: 0, max: 100 },
  readabilityScore: { type: Number, min: 0, max: 100 },
  interviewabilityScore: { type: Number, min: 0, max: 100 },
  overallScore: { type: Number, min: 0, max: 100 },
  specificImprovements: [{ type: String }],
  optimalSolutionExists: { type: Boolean },
  optimalApproach: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('SolutionQualityEval', solutionQualityEvalSchema);`,

  'CalibrationInterview.js': `const mongoose = require('mongoose');
const calibrationInterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attemptedAt: { type: Date, default: Date.now },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DSA' }],
  scores: [mongoose.Schema.Types.Mixed],
  actualLevel: { type: String },
  selfAssessedLevel: { type: String },
  biggestGap: { type: String },
  weakestUnexpectedArea: { type: String },
  percentileEstimate: { type: Number },
  completedAt: { type: Date }
});
module.exports = mongoose.model('CalibrationInterview', calibrationInterviewSchema);`,

  'ActiveRecallNote.js': `const mongoose = require('mongoose');
const activeRecallNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  originalNote: { type: String },
  convertedQuestion: { type: String },
  lastTestedAt: { type: Date },
  correctAnswerCount: { type: Number, default: 0 },
  incorrectAnswerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ActiveRecallNote', activeRecallNoteSchema);`,

  'PressureModeSession.js': `const mongoose = require('mongoose');
const pressureModeSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  startedAt: { type: Date, default: Date.now },
  timeLimitSeconds: { type: Number },
  completedAt: { type: Date },
  timeRemainingOnSubmit: { type: Number },
  simulatedInterviewerPrompts: [mongoose.Schema.Types.Mixed],
  lookedUpAnything: { type: Boolean },
  pressureScore: { type: Number, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PressureModeSession', pressureModeSessionSchema);`,

  'DiagnosticAssessment.js': `const mongoose = require('mongoose');
const diagnosticAssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date, default: Date.now },
  responses: [mongoose.Schema.Types.Mixed],
  startingTopic: { type: String },
  startingPattern: { type: String },
  estimatedLevel: { type: String, enum: ['ABSOLUTE_BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
  fullRoadmapRevealedAt: { type: Date },
  revealedWeeks: { type: Number, default: 0 }
});
module.exports = mongoose.model('DiagnosticAssessment', diagnosticAssessmentSchema);`,

  'DailyBrief.js': `const mongoose = require('mongoose');
const dailyBriefSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  dsaTask: { type: String },
  applicationTask: { type: String },
  resumeTask: { type: String },
  generatedAt: { type: Date, default: Date.now },
  wasOpened: { type: Boolean, default: false },
  tasksCompleted: { type: mongoose.Schema.Types.Mixed, default: {} }
});
module.exports = mongoose.model('DailyBrief', dailyBriefSchema);`,

  'PatternDisguiseDrill.js': `const mongoose = require('mongoose');
const patternDisguiseDrillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  studentGuessedPattern: { type: String },
  correctPattern: { type: String },
  wasCorrect: { type: Boolean },
  timeToIdentify: { type: Number },
  attemptedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PatternDisguiseDrill', patternDisguiseDrillSchema);`,

  'StuckProtocolLog.js': `const mongoose = require('mongoose');
const stuckProtocolLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  triggeredAt: { type: Date, default: Date.now },
  choiceMade: { type: String, enum: ['HINT', 'APPROACH_CHECK', 'MOVE_ON'] },
  hintShown: { type: String },
  approachDescription: { type: String },
  approachFeedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('StuckProtocolLog', stuckProtocolLogSchema);`,

  'AvoidanceLock.js': `const mongoose = require('mongoose');
const avoidanceLockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lockedTopic: { type: String },
  lockedAt: { type: Date, default: Date.now },
  unlockedAt: { type: Date },
  requiredProblems: { type: Number },
  completedProblems: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});
module.exports = mongoose.model('AvoidanceLock', avoidanceLockSchema);`,

  'ProgressStory.js': `const mongoose = require('mongoose');
const progressStorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  storyParagraph: { type: String },
  generatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ProgressStory', progressStorySchema);`,

  'WeeklyHonestReport.js': `const mongoose = require('mongoose');
const weeklyHonestReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  sentence1: { type: String },
  sentence2: { type: String },
  sentence3: { type: String },
  generatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('WeeklyHonestReport', weeklyHonestReportSchema);`
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(modelsDir, name), content);
  console.log('Created ' + name);
}
