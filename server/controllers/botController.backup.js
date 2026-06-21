const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { recordGoalProgress } = require('../services/goalTrackingService');

// @desc    WhatsApp Webhook (Twilio / Meta format)
// @route   POST /api/bot/whatsapp
// @access  Public (Uses standard webhook signature verification in production)
exports.handleWhatsAppMessage = async (req, res) => {
  try {
    // Basic extraction assuming Twilio format for simplicity. 
    // In production with Meta API, shape would be req.body.entry[0].changes[0].value.messages[0]
    const fromPhone = req.body.From; 
    const messageBody = (req.body.Body || '').trim().toLowerCase();

    // 1. Identify User by Phone Number
    // Note: User model would need a `phone` field for this to work natively.
    // For now, we mock lookup or return error if user not found.
    const cleanPhone = fromPhone.replace('whatsapp:', '');
    const last10Digits = cleanPhone.slice(-10);
    const user = await User.findOne({ phone: new RegExp(last10Digits + '$') });
    if (!user) {
      console.log(`Unrecognized phone number: ${fromPhone}`);
      res.set('Content-Type', 'text/xml');
      return res.status(200).send('<Response><Message>User not found. Please link your phone number in StudentTracker.</Message></Response>');
    }

    let responseMessage = 'Command not understood. Try "applied to [Company]" or "interview done with [Company]".';

    // 2. Parse Commands
    if (messageBody.startsWith('applied to ')) {
      const company = messageBody.replace('applied to ', '').trim();
      
      const app = await Application.create({
        userId: user._id,
        company: company,
        role: 'Unknown Role (WhatsApp)',
        source: 'ONLINE',
        status: 'APPLIED',
        dateApplied: new Date()
      });

      await recordGoalProgress(user._id, 'applications', 1, app._id);
      responseMessage = `✅ Logged: Application for ${company}. Goals updated!`;

    } else if (messageBody.startsWith('interview done with ')) {
      const company = messageBody.replace('interview done with ', '').trim();

      const interview = await Interview.create({
        userId: user._id,
        company: company,
        role: 'Unknown Role (WhatsApp)',
        round: '1',
        scheduledAt: new Date(),
        outcome: 'AWAITING_RESULT'
      });

      // Triggers 'interviews' goal progress since outcome is completed
      await recordGoalProgress(user._id, 'interviews', 1, interview._id);
      responseMessage = `✅ Logged: Interview completed with ${company}. Goals updated!`;

    } else if (messageBody.startsWith('clear ')) {
      const company = messageBody.replace('clear ', '').trim();
      const app = await Application.findOne({ 
        userId: user._id, 
        company: { $regex: new RegExp(`^${company}$`, 'i') } 
      }).sort({ dateApplied: -1 });

      if (app) {
        await Application.findByIdAndDelete(app._id);
        responseMessage = `🗑️ Deleted: Most recent application for ${company}.`;
      } else {
        responseMessage = `⚠️ Could not find any application for ${company} to delete.`;
      }
    } else if (messageBody.startsWith('update ') && messageBody.includes(' status to ')) {
      const match = messageBody.match(/^update\s+(.+?)\s+status to\s+(.+)$/i);
      if (match) {
        const company = match[1].trim();
        let newStatus = match[2].trim().toUpperCase().replace(/\s+/g, '_');
        
        if (newStatus === 'OFFERS' || newStatus === 'OFFERED') newStatus = 'OFFER';
        if (newStatus === 'SHORTLIST') newStatus = 'SHORTLISTED';
        if (newStatus === 'REJECT') newStatus = 'REJECTED';
        if (newStatus === 'INTERVIEW') newStatus = 'INTERVIEW_SCHEDULED';

        const validStatuses = ['APPLIED', 'OA_PENDING', 'OA_DONE', 'INTERVIEW_SCHEDULED', 'SHORTLISTED', 'REJECTED', 'OFFER'];
        
        if (!validStatuses.includes(newStatus)) {
          responseMessage = `⚠️ Invalid status. Valid options: Applied, OA Pending, OA Done, Interview Scheduled, Shortlisted, Rejected, Offer.`;
        } else {
          const app = await Application.findOne({ 
            userId: user._id, 
            company: { $regex: new RegExp(`^${company}$`, 'i') } 
          }).sort({ dateApplied: -1 });

          if (app) {
            app.status = newStatus;
            await app.save();
            responseMessage = `✅ Updated: ${company} application status changed to ${newStatus}.`;
          } else {
            responseMessage = `⚠️ Could not find any application for ${company} to update.`;
          }
        }
      }
    }

    // 3. Send Response via Provider (Twilio Example)
    // Send a TwiML response back to Twilio so it texts the user
    const twimlResponse = `
      <Response>
        <Message>${responseMessage}</Message>
      </Response>
    `;

    res.set('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse.trim());
  } catch (error) {
    console.error('WhatsApp Bot Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    WhatsApp Status Callback
// @route   POST /api/bot/whatsapp/status
// @access  Public
exports.handleWhatsAppStatus = async (req, res) => {
  try {
    const messageSid = req.body.MessageSid;
    const messageStatus = req.body.MessageStatus;
    
    // We just log the delivery status. If we wanted to, we could update the DB.
    console.log(`WhatsApp Message [${messageSid}] status changed to: ${messageStatus}`);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp Status Error:', error);
    res.status(500).send('Error');
  }
};
