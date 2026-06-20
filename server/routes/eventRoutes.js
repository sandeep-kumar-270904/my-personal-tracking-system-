const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.get('/slots/find', require('../controllers/eventController').findFreeSlots);

router.get('/sync/google/auth-url', require('../controllers/eventController').getGoogleAuthUrl);
router.post('/sync/google/callback', require('../controllers/eventController').connectGoogleCalendar);
router.post('/sync/google/settings', require('../controllers/eventController').updateGoogleSyncSettings);
router.post('/sync/google/disconnect', require('../controllers/eventController').disconnectGoogleCalendar);
router.post('/sync/google/trigger', require('../controllers/eventController').triggerGoogleSync);

router.get('/:id/ics', require('../controllers/eventController').exportICS);

router.put('/batch-update', require('../controllers/eventController').batchUpdateEvents);
router.post('/batch-delete', require('../controllers/eventController').batchDeleteEvents);

router.get('/:id/rounds', require('../controllers/eventController').getEventRounds);

router.route('/:id')
  .put(updateEvent)
  .delete(deleteEvent);

router.post('/resume-schedule', require('../controllers/eventController').scheduleResumeRevamp);

module.exports = router;
