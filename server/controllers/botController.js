const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { recordGoalProgress } = require('../services/goalTrackingService');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    WhatsApp Webhook (Twilio / Meta format)
// @route   POST /api/bot/whatsapp
// @access  Public (Uses standard webhook signature verification in production)
exports.handleWhatsAppMessage = async (req, res) => {
  try {
    const fromPhone = req.body.From; 
    const messageBody = (req.body.Body || '').trim();

    // 1. Identify User by Phone Number
    const cleanPhone = fromPhone.replace('whatsapp:', '');
    const last10Digits = cleanPhone.slice(-10);
    console.log(`[BotController] Received from: ${fromPhone}, message: "${messageBody}"`);
    
    const user = await User.findOne({ phone: new RegExp(last10Digits + '$') });
    if (!user) {
      res.set('Content-Type', 'text/xml');
      return res.status(200).send('<Response><Message>User not found. Please link your phone number in StudentTracker settings.</Message></Response>');
    }

    let responseMessage = 'I am not sure how to handle that. Try asking to log an application, update a status, or list your interviews.';

    // 2. LLM Intent Parsing
    try {
      const prompt = `You are a helpful assistant for a placement tracking platform called StudentTracker.
User message: "${messageBody}"

Determine the user's intent and extract relevant data.
Return ONLY a raw JSON object (no markdown, no backticks).
Valid intents:
- "LOG_APPLICATION": if they applied to a company. Extract "company".
- "LOG_INTERVIEW": if they completed or scheduled an interview. Extract "company".
- "UPDATE_STATUS": if they are updating status (e.g. got an offer, rejected, screening done, round 1 done). Extract "company" and "newStatus".
  *CRITICAL*: You MUST map their status to exactly one of these: APPLIED, OA_PENDING, OA_DONE, INTERVIEW_SCHEDULED, SHORTLISTED, REJECTED, OFFER. 
  Example: "Round 1 done" -> SHORTLISTED. "Screening" -> INTERVIEW_SCHEDULED. "Got job" -> OFFER. "Failed" -> REJECTED.
- "DELETE_APPLICATION": if they want to delete or clear an app. Extract "company".
- "QUERY_INTERVIEWS": if they ask what interviews they have coming up.
- "QUERY_ANALYTICS": if they ask for stats, like "how many interviews are pending", "how many jobs did I apply to", "show my stats".
- "UNKNOWN": if you don't understand or it's a general question.

Output format example:
{"intent": "UPDATE_STATUS", "company": "Google", "newStatus": "OFFER"}
`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const cleanText = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      console.log('[BotController] Parsed Intent:', parsed);

      const intent = parsed.intent;
      const company = parsed.company;

      if (intent === 'LOG_APPLICATION' && company) {
        const app = await Application.create({
          userId: user._id,
          company: company,
          role: 'Unknown Role (WhatsApp)',
          source: 'ONLINE',
          status: 'APPLIED',
          dateApplied: new Date()
        });
        await recordGoalProgress(user._id, 'applications', 1, app._id);
        responseMessage = `✅ I've logged your application to ${company}. Great job keeping your pipeline active!`;

      } else if (intent === 'LOG_INTERVIEW' && company) {
        const interview = await Interview.create({
          userId: user._id,
          company: company,
          role: 'Unknown Role (WhatsApp)',
          round: '1',
          scheduledAt: new Date(),
          outcome: 'AWAITING_RESULT'
        });
        await recordGoalProgress(user._id, 'interviews', 1, interview._id);
        responseMessage = `📅 Got it! I've logged an interview with ${company}. Good luck!`;

      } else if (intent === 'DELETE_APPLICATION' && company) {
        const app = await Application.findOne({ 
          userId: user._id, 
          company: { $regex: new RegExp(`^${company}$`, 'i') } 
        }).sort({ dateApplied: -1 });

        if (app) {
          await Application.findByIdAndDelete(app._id);
          responseMessage = `🗑️ I've deleted the application for ${company}.`;
        } else {
          responseMessage = `⚠️ I couldn't find an application for ${company} to delete.`;
        }

      } else if (intent === 'UPDATE_STATUS' && company && parsed.newStatus) {
        const newStatus = parsed.newStatus;
        const app = await Application.findOne({ 
          userId: user._id, 
          company: { $regex: new RegExp(`^${company}$`, 'i') } 
        }).sort({ dateApplied: -1 });

        if (app) {
          app.status = newStatus;
          await app.save();
          if (newStatus === 'OFFER') {
            responseMessage = `🎉 INCREDIBLE! Huge congratulations on the offer from ${company}! I've updated your status. Celebrate! 🎊`;
          } else if (newStatus === 'REJECTED') {
            responseMessage = `📝 Status updated to Rejected for ${company}. Don't worry, rejection is just redirection. Keep going!`;
          } else {
            responseMessage = `✅ I've updated your application for ${company} to ${newStatus}.`;
          }
        } else {
          responseMessage = `⚠️ I couldn't find an application for ${company}. Would you like to log it first?`;
        }

      } else if (intent === 'QUERY_INTERVIEWS') {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const upcomingInterviews = await Interview.find({ 
          userId: user._id,
          scheduledAt: { $gte: today }
        }).sort({ scheduledAt: 1 }).limit(5);

        if (upcomingInterviews.length > 0) {
          responseMessage = `Here are your upcoming interviews:\n\n` + 
            upcomingInterviews.map((i, idx) => `${idx + 1}. ${i.company} on ${i.scheduledAt ? i.scheduledAt.toLocaleDateString() : 'TBD'}`).join('\n');
        } else {
          responseMessage = `You don't have any interviews scheduled right now. Time to send out more applications!`;
        }
      } else if (intent === 'QUERY_ANALYTICS') {
        const totalApps = await Application.countDocuments({ userId: user._id });
        const pendingInterviews = await Interview.countDocuments({ userId: user._id, outcome: 'AWAITING_RESULT' });
        const totalOffers = await Application.countDocuments({ userId: user._id, status: 'OFFER' });
        const rejections = await Application.countDocuments({ userId: user._id, status: 'REJECTED' });
        
        responseMessage = `📊 *Your Placement Stats*\n\n` +
          `• Total Applications: ${totalApps}\n` +
          `• Pending Interviews: ${pendingInterviews}\n` +
          `• Offers Received: ${totalOffers}\n` +
          `• Rejections: ${rejections}\n\n` +
          (totalOffers > 0 ? `Keep up the amazing work! 🚀` : `Keep grinding, your breakthrough is coming! 💪`);
      } else {
        responseMessage = "Hmm, I didn't quite catch that. You can say things like 'I applied to Amazon', 'List my interviews', 'Show my stats', or 'Update Google status to offer'.";
      }

    } catch (llmError) {
      console.error('[BotController] LLM Parsing Error:', llmError);
      responseMessage = `Sorry, my AI brain is having a slight hiccup processing that request. Please try again in a moment!`;
    }

    // 3. Send Response via Provider (Twilio Example)
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

// @desc    Send outbound WhatsApp message
// @access  Internal
exports.sendWhatsAppMessage = async (phone, message) => {
  if (!phone) return;
  console.log(`\n[Twilio Outbound] WhatsApp message to ${phone}:\n${message}\n`);
  
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Sandbox default
      
      await client.messages.create({ 
        body: message, 
        from: fromNumber, 
        to: `whatsapp:${phone}` 
      });
      return true;
    } else {
      console.log('Twilio credentials missing. Running in mock mode.');
      return true;
    }
  } catch (error) {
    console.error('Error sending Twilio message:', error);
    return false;
  }
};
