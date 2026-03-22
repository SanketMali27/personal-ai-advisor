const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {
  uploadDocument,
  getUserDocuments,
} = require('../controllers/documentController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getUserDocuments);

module.exports = router;
