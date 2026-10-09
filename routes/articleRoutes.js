// routes/articleRoutes.js - נתיבים ציבוריים (פתוחים לכולם, כולל אורחים)
const express = require('express');
const router = express.Router();

const publicArticleController = require('../controllers/publicArticleController');
const commentController = require('../controllers/commentController');
const commentRateLimiter = require('../middleware/commentRateLimiter');

router.get('/', publicArticleController.renderHome);
router.get('/articles/:id', publicArticleController.renderArticle);

router.get('/api/articles', publicArticleController.listArticles);
router.get('/api/articles/:id/comments', commentController.listComments);
router.post('/api/articles/:id/comments', commentRateLimiter, commentController.addComment);

module.exports = router;
