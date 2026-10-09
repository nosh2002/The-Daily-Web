// controllers/editorController.js
// אזור העורך: צפייה בכלל הכתבות, אישור/החזרה/עריכה/מחיקה, ואכיפת מפת המעברים
// המותרת (ALLOWED_TRANSITIONS) כך שאף קריאת API לא תוכל "לקפוץ" למצב לא חוקי.

const Article = require('../models/Article');
const PublishEvent = require('../models/PublishEvent');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const {
  ARTICLE_STATUS,
  ALLOWED_TRANSITIONS,
  STATUS_LABELS_HE,
  CATEGORIES,
} = require('../utils/constants');
const logger = require('../utils/logger');

function assertTransitionAllowed(fromStatus, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(
      `מעבר ממצב "${STATUS_LABELS_HE[fromStatus]}" למצב "${STATUS_LABELS_HE[toStatus]}" אינו מותר`,
      409
    );
  }
}

// כדי שהלוח יישאר מהיר ושמיש גם כשמאגר הכתבות מכיל אלפים (כנדרש במסמך
// הדרישות), לא טוענים את כל הכתבות התואמות בבת אחת - יש עימוד (pagination).
const EDITOR_PAGE_SIZE = 50;

// GET /editor - לוח בקרה: כלל הכתבות במערכת, ניתנות לסינון לפי מצב (?status=)
const dashboard = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && Object.values(ARTICLE_STATUS).includes(req.query.status)) {
    filter.status = req.query.status;
  }
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate('author', 'displayName username')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * EDITOR_PAGE_SIZE)
      .limit(EDITOR_PAGE_SIZE)
      .lean(),
    Article.countDocuments(filter),
  ]);

  res.render('editor/dashboard', {
    title: 'אזור העורך',
    articles,
    STATUS_LABELS_HE,
    ARTICLE_STATUS,
    activeStatus: req.query.status || '',
    page,
    totalPages: Math.max(Math.ceil(total / EDITOR_PAGE_SIZE), 1),
  });
});

// GET /editor/articles/:id/review
const renderReview = asyncHandler(async (req, res, next) => {
  const article = await Article.findById(req.params.id).populate('author', 'displayName username').lean();
  if (!article) return next(new AppError('הכתבה לא נמצאה', 404));

  res.render('editor/review', {
    title: 'בדיקת כתבה',
    article,
    categories: CATEGORIES,
    STATUS_LABELS_HE,
  });
});

// PATCH /editor/api/articles/:id - לעורך מותר לערוך את התוכן הנבדק בעצמו.
// לפי הדרישה, ההרשאה הזו מוגדרת במפורש "עבור כתבה שממתינה לאישור" - לכן
// נאכף כאן גם status===pending ולא רק ההרשאה הכללית (requireEditor). בלי זה,
// קריאת API ישירה הייתה יכולה לערוך תוכן של כתבה בטיוטה/פורסמה, שאינה בתהליך
// בדיקה כרגע.
const editContent = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) throw new AppError('הכתבה לא נמצאה', 404);
  if (article.status !== ARTICLE_STATUS.PENDING) {
    throw new AppError('ניתן לערוך תוכן רק עבור כתבה שממתינה כרגע לאישור', 409);
  }

  const { title, summary, body, category, imageUrl } = req.body;
  if (title !== undefined) article.content.title = String(title).slice(0, 200);
  if (summary !== undefined) article.content.summary = String(summary).slice(0, 400);
  if (body !== undefined) article.content.body = String(body);
  if (category !== undefined && CATEGORIES.includes(category)) article.content.category = category;
  if (imageUrl !== undefined) article.content.imageUrl = String(imageUrl).slice(0, 500) || '/img/placeholder.svg';

  await article.save();
  res.json({ success: true });
});

// POST /editor/api/articles/:id/approve - אישור ופרסום
const approve = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) throw new AppError('הכתבה לא נמצאה', 404);

  assertTransitionAllowed(article.status, ARTICLE_STATUS.PUBLISHED);

  const nextVersion = (article.published.publishedByVersion || 0) + 1;

  article.published = {
    isPublished: true,
    title: article.content.title,
    summary: article.content.summary,
    body: article.content.body,
    category: article.content.category,
    imageUrl: article.content.imageUrl,
    publishedAt: new Date(),
    publishedByVersion: nextVersion,
  };
  article.status = ARTICLE_STATUS.PUBLISHED;
  article.editorNote = '';
  article.lastHandledBy = req.session.user.id;
  await article.save();

  await PublishEvent.create({
    article: article._id,
    publishedAt: article.published.publishedAt,
    version: nextVersion,
    editor: req.session.user.id,
  });

  logger.info('כתבה אושרה ופורסמה', { articleId: article._id.toString(), version: nextVersion });

  res.json({ success: true, status: article.status });
});

// POST /editor/api/articles/:id/return - החזרה לכתב עם הערה
const returnToReporter = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) throw new AppError('הכתבה לא נמצאה', 404);

  assertTransitionAllowed(article.status, ARTICLE_STATUS.RETURNED);

  const { note } = req.body;
  if (!note || !note.trim()) {
    throw new AppError('יש לצרף הערה המסבירה אילו תיקונים נדרשים', 400);
  }

  article.status = ARTICLE_STATUS.RETURNED;
  article.editorNote = note.trim().slice(0, 1000);
  article.lastHandledBy = req.session.user.id;
  await article.save();

  logger.info('כתבה הוחזרה לתיקונים', { articleId: article._id.toString() });

  res.json({ success: true, status: article.status });
});

// DELETE /editor/api/articles/:id
const remove = asyncHandler(async (req, res) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) throw new AppError('הכתבה לא נמצאה', 404);
  logger.info('כתבה נמחקה ע"י עורך', { articleId: article._id.toString(), editor: req.session.user.username });
  res.json({ success: true });
});

module.exports = { dashboard, renderReview, editContent, approve, returnToReporter, remove };
