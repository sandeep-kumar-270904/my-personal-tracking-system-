const Application = require('../models/Application');
const ApplicationTimeline = require('../models/ApplicationTimeline');
const ApplicationSuggestion = require('../models/ApplicationSuggestion');
const Interview = require('../models/Interview');

exports.recalculateMomentum = async (req, res) => {
  try {
    const apps = await Application.find({
      status: { $nin: ['REJECTED', 'OFFER'] },
      isArchived: false,
      momentumDecay: true
    });

    const now = new Date();

    for (const app of apps) {
      let score = 100;
      
      const latestTimeline = await ApplicationTimeline.findOne({ applicationId: app._id }).sort({ createdAt: -1 });
      const lastActionDate = latestTimeline ? latestTimeline.createdAt : app.createdAt;
      
      const daysSinceAction = Math.floor((now - new Date(lastActionDate)) / (1000 * 60 * 60 * 24));
      const daysSinceApplied = Math.floor((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24));

      score -= (daysSinceAction * 5);
      
      if (daysSinceApplied >= 14 && app.status === 'APPLIED') {
        score -= 10;
      }

      if (daysSinceAction <= 7 && latestTimeline && latestTimeline.event.includes('Status changed')) {
        score += 20;
      }

      const interviews = await Interview.find({ userId: app.userId, company: app.company, role: app.role });
      
      let hasFutureInterview = false;
      let hasPassedNoDebrief = false;

      interviews.forEach(int => {
        if (new Date(int.scheduledAt) > now) {
          hasFutureInterview = true;
        } else if (new Date(int.scheduledAt) < now && (!int.notes || int.notes.trim() === '')) {
          hasPassedNoDebrief = true;
        }
      });

      if (hasFutureInterview) score += 15;
      if (hasPassedNoDebrief) score -= 20;

      app.momentumScore = Math.max(0, Math.min(100, score));
      await app.save();
    }

    res.json({ message: `Recalculated momentum for ${apps.length} applications` });
  } catch (error) {
    console.error('Momentum cron error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.checkStatusSignals = async (req, res) => {
  try {
    const apps = await Application.find({ isArchived: false, status: { $nin: ['REJECTED', 'OFFER'] } });
    const now = new Date();
    let suggestionsCreated = 0;

    for (const app of apps) {
      const daysSinceApplied = Math.floor((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24));
      
      // Suggest REJECTED or Follow-up if APPLIED and 21+ days with no update
      if (app.status === 'APPLIED' && daysSinceApplied >= 21) {
        const existing = await ApplicationSuggestion.findOne({ applicationId: app._id, suggestionType: 'GHOSTED' });
        if (!existing) {
          await ApplicationSuggestion.create({
            applicationId: app._id,
            userId: app.userId,
            suggestionType: 'GHOSTED',
            suggestedStatus: 'REJECTED',
            reason: '21+ days passed with no update since applying.'
          });
          suggestionsCreated++;
        }
      }

      // Suggest OA sent if OA_PENDING and 7+ days
      if (app.status === 'OA_PENDING' && daysSinceApplied >= 7) {
        const existing = await ApplicationSuggestion.findOne({ applicationId: app._id, suggestionType: 'CHECK_OA' });
        if (!existing) {
          await ApplicationSuggestion.create({
            applicationId: app._id,
            userId: app.userId,
            suggestionType: 'CHECK_OA',
            suggestedStatus: 'OA_DONE',
            reason: '7+ days since OA Pending. Did you receive it in your email?'
          });
          suggestionsCreated++;
        }
      }

      // Suggest updating if INTERVIEW_SCHEDULED and passed with no update
      if (app.status === 'INTERVIEW_SCHEDULED') {
        const pastInterview = await Interview.findOne({ 
          userId: app.userId, 
          company: app.company, 
          role: app.role,
          scheduledAt: { $lt: now } 
        });

        if (pastInterview) {
          const existing = await ApplicationSuggestion.findOne({ applicationId: app._id, suggestionType: 'UPDATE_AFTER_INTERVIEW' });
          if (!existing) {
            await ApplicationSuggestion.create({
              applicationId: app._id,
              userId: app.userId,
              suggestionType: 'UPDATE_AFTER_INTERVIEW',
              suggestedStatus: 'SHORTLISTED',
              reason: 'Scheduled interview has passed. Have you heard back?'
            });
            suggestionsCreated++;
          }
        }
      }
    }

    res.json({ message: `Created ${suggestionsCreated} status suggestions` });
  } catch (error) {
    console.error('Status signal cron error:', error);
    res.status(500).json({ error: error.message });
  }
};
