const mongoose = require('mongoose');

const interviewCommunicationSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  communicationType: {
    type: String,
    enum: ['INTERVIEW_INVITE', 'CONFIRMATION', 'RESCHEDULE', 'FOLLOW_UP_SENT', 'FOLLOW_UP_RECEIVED', 'FEEDBACK_REQUEST', 'OFFER_CALL', 'REJECTION_EMAIL', 'THANK_YOU_SENT']
  },
  content: { type: String, required: true },
  direction: {
    type: String,
    enum: ['INBOUND', 'OUTBOUND']
  },
  communicatedAt: { type: Date, default: Date.now },
  extractedData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('InterviewCommunication', interviewCommunicationSchema);
