const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  addSummaryMessage,
} = require('../controllers/chatController');

router.post('/create-session', auth, createSession);
router.get('/sessions', auth, getSessions);
router.get('/session/:id', auth, getSession);
router.post('/message', auth, sendMessage);
router.post('/summary-message', auth, addSummaryMessage);

module.exports = router;
