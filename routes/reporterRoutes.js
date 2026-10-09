// routes/reporterRoutes.js
const express = require('express');
const router = express.Router();

const reporterController = require('../controllers/reporterController');
const { requireReporter } = require('../middleware/auth');

router.use(requireReporter);

router.get('/', reporterController.dashboard);
// POST ולא GET בכוונה: הפעולה הזו יוצרת מסמך חדש במסד הנתונים (יש לה תופעת
// לוואי), ולכן אינה יכולה להיות GET לפי סמנטיקת HTTP/REST - GET חייב להיות
// "בטוח" ואידמפוטנטי (רענון/כניסה חוזרת לכתובת לא אמורים ליצור נתונים חדשים).
router.post('/articles/new', reporterController.createNew);
router.get('/articles/:id/edit', reporterController.renderEdit);

router.patch('/api/articles/:id', reporterController.autosave);
router.post('/api/articles/:id/submit', reporterController.submit);

module.exports = router;
