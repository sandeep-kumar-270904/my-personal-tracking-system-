const ApplicationTemplate = require('../models/ApplicationTemplate');
const SharedView = require('../models/SharedView');
const Application = require('../models/Application');
const crypto = require('crypto');

// --- Templates ---
const getTemplates = async (req, res) => {
  try {
    let templates = await ApplicationTemplate.find({ userId: req.user._id });
    
    // Seed default templates on first use
    if (templates.length === 0) {
      const defaults = [
        { userId: req.user._id, name: 'Campus Drive', defaultStatus: 'APPLIED', defaultSource: 'CAMPUS', defaultPriority: 'HIGH' },
        { userId: req.user._id, name: 'Online Application', defaultStatus: 'APPLIED', defaultSource: 'ONLINE', defaultPriority: 'MEDIUM' },
        { userId: req.user._id, name: 'Referral', defaultStatus: 'APPLIED', defaultSource: 'REFERRAL', defaultPriority: 'HIGH', defaultNotes: 'Applied via referral from [name]' }
      ];
      await ApplicationTemplate.insertMany(defaults);
      templates = await ApplicationTemplate.find({ userId: req.user._id });
    }
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const template = new ApplicationTemplate({ ...req.body, userId: req.user._id });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const template = await ApplicationTemplate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await ApplicationTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!template) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Share & Export ---
const shareApplications = async (req, res) => {
  try {
    const { filters } = req.body;
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const shared = new SharedView({
      userId: req.user._id,
      token,
      filters,
      expiresAt
    });
    await shared.save();
    res.json({ url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/shared/applications/${token}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportPDF = async (req, res) => {
  try {
    // Generate PDF server-side using pdfkit or puppeteer
    // For now we'll use puppeteer to generate a quick HTML table PDF
    const puppeteer = require('puppeteer');
    const apps = await Application.find({ userId: req.user._id, deletedAt: null }).sort({ dateApplied: -1 });
    
    let html = `<html><head><style>body { font-family: Arial; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head><body>`;
    html += `<h1>My Applications</h1>`;
    html += `<table><tr><th>Company</th><th>Role</th><th>Status</th><th>Applied Date</th></tr>`;
    apps.forEach(app => {
      html += `<tr><td>${app.company}</td><td>${app.role}</td><td>${app.status}</td><td>${new Date(app.dateApplied).toLocaleDateString()}</td></tr>`;
    });
    html += `</table></body></html>`;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' } });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Applications_Report.pdf"'
    });
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSharedApplications = async (req, res) => {
  try {
    const shared = await SharedView.findOne({ token: req.params.token });
    if (!shared || shared.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Link expired or invalid' });
    }
    
    shared.viewCount += 1;
    await shared.save();

    // Reconstruct query using filters (simplified)
    const query = { userId: shared.userId, deletedAt: null };
    if (shared.filters?.status) query.status = shared.filters.status;
    if (shared.filters?.source) query.source = shared.filters.source;
    if (shared.filters?.priority) query.priority = shared.filters.priority;

    const apps = await Application.find(query)
      .select('company role status dateApplied source priority fitScore') // omit sensitive fields like notes, resumeId, jobDescriptionUrl
      .sort({ dateApplied: -1 });
      
    // Fetch user basic info
    const User = require('../models/User');
    const user = await User.findById(shared.userId).select('name college');

    res.json({ user, apps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  shareApplications, exportPDF, getSharedApplications
};
