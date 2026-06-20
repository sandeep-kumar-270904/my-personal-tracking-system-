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
    const user = await User.findOne({ phone: fromPhone.replace('whatsapp:', '') });
    if (!user) {
      // Return 200 so webhook doesn't retry, but send response to user
      console.log(`Unrecognized phone number: ${fromPhone}`);
      return res.status(200).send('User not found. Please link your phone number in StudentTracker.');
    }

    let responseMessage = 'Command not understood. Try "applied to [Company]" or "interview done with [Company]".';

    // 2. Parse Commands
    if (messageBody.startsWith('applied to ')) {
      const company = messageBody.replace('applied to ', '').trim();
      
      const app = await Application.create({
        userId: user._id,
        company: company,
        role: 'Unknown Role (WhatsApp)',
        source: 'OTHER',
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
    }

    // 3. Send Response via Provider (Twilio Example)
    // const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    // await twilioClient.messages.create({ body: responseMessage, from: req.body.To, to: fromPhone });

    // In a Meta WhatsApp API setup, you'd use Axios to hit graph.facebook.com

    res.status(200).send('<Response></Response>'); // Twilio expects empty TwiML or 200 OK
  } catch (error) {
    console.error('WhatsApp Bot Error:', error);
    res.status(500).json({ message: error.message });
  }
};
