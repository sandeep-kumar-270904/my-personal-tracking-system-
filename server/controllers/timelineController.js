const UnifiedTimeline = require('../models/UnifiedTimeline');
const Application = require('../models/Application');
const PDFDocument = require('pdfkit');

exports.getUnifiedTimeline = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { userId: req.user._id };
    
    if (type && type !== 'ALL') {
      query.sourceTable = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await UnifiedTimeline.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await UnifiedTimeline.countDocuments(query);

    res.json({
      events,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportJourneyPDF = async (req, res) => {
  try {
    const userId = req.user._id;
    const events = await UnifiedTimeline.find({ userId }).sort({ createdAt: 1 });
    
    // Calculate simple stats
    const stats = {
      applicationsSent: events.filter(e => e.sourceTable === 'APPLICATION' && e.eventType === 'CREATED').length,
      rejectionsFaced: events.filter(e => e.sourceTable === 'APPLICATION' && e.title.includes('REJECTED')).length,
      interviewsCracked: events.filter(e => e.sourceTable === 'INTERVIEW' && e.title.includes('PASSED')).length, // We'll add PASSED logic later
      offersReceived: events.filter(e => e.sourceTable === 'OFFER' && e.eventType === 'CREATED').length,
      dsaSolved: events.filter(e => e.sourceTable === 'DSA' && e.eventType === 'CREATED').length,
      contestsParticipated: events.filter(e => e.sourceTable === 'CONTEST' && e.eventType === 'CREATED').length,
    };

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    let totalDays = 0;
    if (firstEvent && lastEvent) {
      totalDays = Math.ceil((lastEvent.createdAt - firstEvent.createdAt) / (1000 * 60 * 60 * 24));
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=My_Placement_Season_Story.pdf');
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('My Placement Season Story', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Stats
    doc.fontSize(16).font('Helvetica-Bold').text('Journey by the Numbers');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Days of Journey: ${totalDays} days`);
    doc.text(`Applications Sent: ${stats.applicationsSent}`);
    doc.text(`Rejections Faced: ${stats.rejectionsFaced} (Learning opportunities)`);
    doc.text(`Interviews Completed: ${events.filter(e => e.sourceTable === 'INTERVIEW').length}`);
    doc.text(`Final Offers Received: ${stats.offersReceived}`);
    doc.text(`DSA Problems Solved: ${stats.dsaSolved}`);
    doc.text(`Contests Participated: ${stats.contestsParticipated}`);
    doc.moveDown(2);

    // Timeline
    doc.fontSize(16).font('Helvetica-Bold').text('The Timeline');
    doc.moveDown(0.5);
    
    events.forEach(event => {
      const date = new Date(event.createdAt).toLocaleDateString();
      doc.fontSize(10).font('Helvetica-Bold').text(`${date} - ${event.title}`);
      if (event.description) {
        doc.fontSize(10).font('Helvetica').text(event.description);
      }
      doc.moveDown(0.5);
    });

    doc.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
