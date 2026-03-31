const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  processYoutubeVideo,
  chatWithYoutubeVideo,
  getYoutubeVideo,
  getYoutubeHistory,
  deleteYoutubeVideo,
} = require('../controllers/youtubeController');

router.post('/process', auth, processYoutubeVideo);
router.post('/chat', auth, chatWithYoutubeVideo);
router.get('/history', auth, getYoutubeHistory);
router.get('/:videoId', auth, getYoutubeVideo);
router.delete('/:videoId', auth, deleteYoutubeVideo);

module.exports = router;
