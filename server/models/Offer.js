const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const offerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offer_type: {
    type: String,
    enum: ['internship', 'full_time', 'ppo'],
    default: 'full_time'
  },
  linked_offer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  internship_duration_months: {
    type: Number
  },
  stipend_monthly: {
    type: Number
  },
  company_name: {
    type: String,
    required: true
  },
  role_title: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  work_mode: {
    type: String,
    enum: ['onsite', 'hybrid', 'remote'],
    default: 'onsite'
  },
  offer_received_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  decision_deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending_decision', 'accepted', 'declined', 'expired', 'withdrawn_by_company', 'on_hold'],
    default: 'pending_decision'
  },
  source_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  referred_by_contact_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network'
  },

  // CTC breakdown
  ctc_annual: {
    type: Number,
    required: function() { return this.offer_type !== 'internship'; }
  },
  base_salary: {
    type: Number
  },
  variable_bonus: {
    type: Number
  },
  joining_bonus: {
    type: Number
  },
  joining_bonus_clawback_note: {
    type: String
  },
  retention_bonus: {
    type: Number
  },
  stocks_rsu_value: {
    type: Number
  },
  stocks_vesting_note: {
    type: String
  },
  other_benefits_value: {
    type: Number
  },

  // Bond / service agreement
  has_bond: {
    type: Boolean,
    default: false
  },
  bond_duration_months: {
    type: Number
  },
  bond_penalty_amount: {
    type: Number
  },
  bond_notes: {
    type: String
  },

  // Other real factors
  probation_period_months: {
    type: Number
  },
  notice_period_days: {
    type: Number
  },
  relocation_allowance: {
    type: Number
  },

  notes: {
    type: String
  },
  
  // v2 Fields
  negotiationLog: [{
    date: { type: Date, default: Date.now },
    note: { type: String, required: true }
  }],
  extension_requested: {
    type: Boolean,
    default: false
  },
  extension_requested_date: {
    type: Date
  },
  extension_granted: {
    type: Boolean,
    default: false
  },
  offer_document_url: {
    type: String
  },
  
  // v3 Fields
  revisions: [{
    revised_ctc_annual: Number,
    revised_base_salary: Number,
    revised_joining_bonus: Number,
    revision_date: { type: Date, default: Date.now },
    reason: String
  }],
  postAcceptanceTasks: [{
    task_type: { 
      type: String, 
      enum: ['document_submission', 'background_verification', 'medical_test', 'induction', 'relocation', 'custom'],
      default: 'custom'
    },
    title: { type: String, required: true },
    due_date: Date,
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    notes: String
  }],
  
  // v7 Fields
  offer_channel: {
    type: String,
    enum: ['on_campus_drive', 'off_campus_referral', 'off_campus_application', 'other'],
    default: 'on_campus_drive'
  },
  payslip_verified: {
    type: Boolean,
    default: false
  },
  actual_gross: {
    type: Number
  },
  actual_net: {
    type: Number
  },
  payslip_document_url: {
    type: String
  }
}, { timestamps: true });

offerSchema.plugin(timelinePlugin);

module.exports = mongoose.model('Offer', offerSchema);
