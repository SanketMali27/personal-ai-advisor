const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  createSession,
  getSessions,
  getSession,
  sendMessage,
} = require('../controllers/chatController');

router.post('/create-session', auth, createSession);
router.get('/sessions', auth, getSessions);
router.get('/session/:id', auth, getSession);
router.post('/message', auth, sendMessage);

module.exports = router;
