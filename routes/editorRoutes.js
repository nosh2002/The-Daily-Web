// routes/editorRoutes.js
const express = require('express');
const router = express.Router();

const editorController = require('../controllers/editorController');
const statsController = require('../controllers/statsController');
const userController = require('../controllers/userController');
const commentController = require('../controllers/commentController');
const { requireEditor } = require('../middleware/auth');

router.use(requireEditor);

router.get('/', editorController.dashboard);
router.get('/articles/:id/review', editorController.renderReview);
router.get('/stats', statsController.renderStatsPicker);
router.get('/stats/:id', statsController.renderStatsForArticle);
router.get('/users', userController.listReporters);

router.get('/api/stats/articles/:id', statsController.getArticleStats);

router.patch('/api/articles/:id', editorController.editContent);
router.post('/api/articles/:id/approve', editorController.approve);
router.post('/api/articles/:id/return', editorController.returnToReporter);
router.delete('/api/articles/:id', editorController.remove);

// ניהול משתמשים (CRUD מלא על מודל User - ראו controllers/userController.js)
router.post('/api/users', userController.createReporter);
router.patch('/api/users/:id', userController.updateReporter);
router.delete('/api/users/:id', userController.deleteReporter);

// מודרציית תגובות (Update/Delete על מודל Comment - Create/Read כבר קיימים
// בנתיבים הציבוריים ב-routes/articleRoutes.js)
router.patch('/api/comments/:id', commentController.updateComment);
router.delete('/api/comments/:id', commentController.deleteComment);

module.exports = router;
