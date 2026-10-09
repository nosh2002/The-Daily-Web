// controllers/commentController.js
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// POST /api/articles/:id/comments - הוספת תגובה חדשה (מוגן ע"י commentRateLimiter ב-route)
const addComment = asyncHandler(async (req, res, next) => {
  const { authorName, text } = req.body;

  if (!authorName || !authorName.trim() || !text || !text.trim()) {
    return next(new AppError('יש למלא שם ותוכן תגובה', 400));
  }
  if (text.length > 1000) {
    return next(new AppError('התגובה ארוכה מדי (מקסימום 1000 תווים)', 400));
  }

  const article = await Article.findById(req.params.id).select('published').lean();
  if (!article || !article.published || !article.published.isPublished) {
    return next(new AppError('לא ניתן להגיב לכתבה זו', 404));
  }

  const comment = await Comment.create({
    article: article._id,
    authorName: authorName.trim().slice(0, 60),
    text: text.trim(),
    deviceId: req.deviceId,
  });

  res.status(201).json({
    success: true,
    comment: {
      id: comment._id,
      authorName: comment.authorName,
      text: comment.text,
      createdAt: comment.createdAt,
    },
  });
});

// GET /api/articles/:id/comments - שליפת רשימת תגובות (משמש גם ל-EJS SSR וגם ל-ajax רענון)
const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ article: req.params.id }).sort({ createdAt: 1 }).lean();
  res.json({
    success: true,
    comments: comments.map((c) => ({
      id: c._id,
      authorName: c.authorName,
      text: c.text,
      createdAt: c.createdAt,
    })),
  });
});

// PATCH /editor/api/comments/:id - עריכת/צנזור תוכן תגובה ע"י עורך (מודרציה,
// כנדרש: "האתר רשאי, לפי שיקול דעתו, שלא לפרסם או להסיר תגובה"). מוגן ע"י
// requireEditor ברמת ה-router - לא הסתרת כפתור בלבד.
const updateComment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return next(new AppError('יש להזין תוכן תגובה', 400));
  }

  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    { text: text.trim().slice(0, 1000) },
    { new: true }
  );
  if (!comment) return next(new AppError('התגובה לא נמצאה', 404));

  res.json({
    success: true,
    comment: { id: comment._id, authorName: comment.authorName, text: comment.text, createdAt: comment.createdAt },
  });
});

// DELETE /editor/api/comments/:id - הסרת תגובה ע"י עורך
const deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findByIdAndDelete(req.params.id);
  if (!comment) return next(new AppError('התגובה לא נמצאה', 404));
  res.json({ success: true });
});

module.exports = { addComment, listComments, updateComment, deleteComment };
