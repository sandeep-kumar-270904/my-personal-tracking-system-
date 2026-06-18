const Application = require('../models/Application');
const Interview = require('../models/Interview');
const DSA = require('../models/DSA');
const Offer = require('../models/Offer');
const { Parser } = require('json2csv');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

exports.exportJson = async (req, res) => {
  try {
    const userId = req.user._id;
    const apps = await Application.find({ userId });
    const interviews = await Interview.find({ userId });
    const dsa = await DSA.find({ userId });
    const offers = await Offer.find({ userId });

    const exportData = {
      applications: apps,
      interviews,
      dsa,
      offers,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=studenttracker_export.json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export JSON' });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user._id }).lean();
    if (!apps.length) return res.status(404).json({ error: 'No applications found' });

    const fields = ['company', 'role', 'status', 'appliedDate', 'location', 'url'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(apps);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user._id }).lean();
    const offers = await Offer.find({ userId: req.user._id }).lean();

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #ff6b00; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>StudentTracker Placement Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          
          <h2>Summary</h2>
          <p>Total Applications: ${apps.length}</p>
          <p>Total Offers: ${offers.length}</p>

          <h2>Applications Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Applied</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(app => `
                <tr>
                  <td>${app.company}</td>
                  <td>${app.role}</td>
                  <td>${app.status}</td>
                  <td>${new Date(app.appliedDate).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=placement_report.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};

exports.importCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const tempPath = req.file.path;
    const results = [];

    fs.createReadStream(tempPath)
      .pipe(csvParser())
      .on('data', (data) => {
        if (data.company && data.role) {
          results.push({
            userId: req.user._id,
            company: data.company,
            role: data.role,
            status: data.status || 'Applied',
            appliedDate: data.date ? new Date(data.date) : new Date(),
          });
        }
      })
      .on('end', async () => {
        // Bulk insert avoiding duplicates based on company+role
        for (const item of results) {
          const exists = await Application.findOne({ userId: req.user._id, company: item.company, role: item.role });
          if (!exists) {
            await Application.create(item);
          }
        }
        fs.unlinkSync(tempPath);
        res.status(200).json({ message: 'Import successful', count: results.length });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
};
