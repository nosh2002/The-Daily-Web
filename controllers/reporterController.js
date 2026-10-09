// controllers/reporterController.js
// אזור הכתב: יצירה/עריכה/שליחה לאישור של הכתבות ששייכות לכתב המחובר בלבד.

const Article = require('../models/Article');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { ARTICLE_STATUS, ALLOWED_TRANSITIONS, CATEGORIES, STATUS_LABELS_HE } = require('../utils/constants');
const logger = require('../utils/logger');

// סטטוסים שבהם מותר לכתב לערוך את תוכן הכתבה. "pending" נעול - הכתבה אצל
// העורך לבדיקה ואי אפשר "להזיז לו את השטיח" תוך כדי הבדיקה.
//
// חשוב: הרשימה נגזרת אוטומטית מ-ALLOWED_TRANSITIONS (אותה מפה שהעורך נשען
// עליה ב-editorController) ולא מוגדרת כרשימה נפרדת - כך יש מקור אמת יחיד
// למעברי מצב, ולא שתי רשימות שעלולות להתפצל זו מזו בעתיד. סטטוס "ניתן לעריכה
// ע"י הכתב" מוגדר כאן כ"סטטוס שממנו מותר לעבור ל-PENDING".
const EDITABLE_STATUSES = Object.keys(ALLOWED_TRANSITIONS).filter((status) =>
  ALLOWED_TRANSITIONS[status].includes(ARTICLE_STATUS.PENDING)
);

async function getOwnedArticleOr404(articleId, userId) {
  const article = await Article.findOne({ _id: articleId, author: userId });
  if (!article) throw new AppError('הכתבה לא נמצאה', 404);
  return article;
}

// GET /reporter - לוח בקרה: הכתבות שלי, מקובצות לפי מצב
const dashboard = asyncHandler(async (req, res) => {
  const articles = await Article.find({ author: req.session.user.id })
    .sort({ updatedAt: -1 })
    .lean();

  res.render('reporter/dashboard', {
    title: 'אזור הכתב',
    articles,
    STATUS_LABELS_HE,
  });
});

// GET /reporter/articles/new - יוצר כתבה ריקה מיידית כדי שיהיה ID לשמירה אוטומטית
const createNew = asyncHandler(async (req, res) => {
  const article = await Article.create({
    author: req.session.user.id,
    content: {
      title: 'כתבה ללא כותרת',
      summary: '',
      body: '',
      category: CATEGORIES[0],
      imageUrl: '/img/placeholder.svg',
    },
    status: ARTICLE_STATUS.DRAFT,
  });
  res.redirect(`/reporter/articles/${article._id}/edit`);
});

// GET /reporter/articles/:id/edit
const renderEdit = asyncHandler(async (req, res) => {
  const article = await getOwnedArticleOr404(req.params.id, req.session.user.id);
  res.render('reporter/edit', {
    title: 'עריכת כתבה',
    article,
    categories: CATEGORIES,
    editable: EDITABLE_STATUSES.includes(article.status),
    STATUS_LABELS_HE,
  });
});

// PATCH /reporter/api/articles/:id - שמירה אוטומטית של תוכן (autosave)
const autosave = asyncHandler(async (req, res, next) => {
  const article = await getOwnedArticleOr404(req.params.id, req.session.user.id);

  if (!EDITABLE_STATUSES.includes(article.status)) {
    return next(new AppError('לא ניתן לערוך כתבה שממתינה כרגע לאישור עורך', 409));
  }

  const { title, summary, body, category, imageUrl } = req.body;
  if (title !== undefined) article.content.title = String(title).slice(0, 200);
  if (summary !== undefined) article.content.summary = String(summary).slice(0, 400);
  if (body !== undefined) article.content.body = String(body);
  if (category !== undefined && CATEGORIES.includes(category)) article.content.category = category;
  if (imageUrl !== undefined) article.content.imageUrl = String(imageUrl).slice(0, 500) || '/img/placeholder.svg';

  article.lastSavedAt = new Date();
  await article.save();

  res.json({ success: true, lastSavedAt: article.lastSavedAt });
});

// POST /reporter/api/articles/:id/submit - שליחה לאישור עורך
const submit = asyncHandler(async (req, res, next) => {
  const article = await getOwnedArticleOr404(req.params.id, req.session.user.id);

  if (!EDITABLE_STATUSES.includes(article.status)) {
    return next(new AppError('אי אפשר לשלוח כתבה זו לאישור במצבה הנוכחי', 409));
  }
  if (!article.content.title.trim() || !article.content.body.trim() || !article.content.summary.trim()) {
    return next(new AppError('יש למלא כותרת, תקציר ותוכן לפני שליחה לאישור', 400));
  }

  article.status = ARTICLE_STATUS.PENDING;
  article.editorNote = '';
  await article.save();

  logger.info('כתבה נשלחה לאישור עורך', { articleId: article._id.toString(), reporter: req.session.user.username });

  res.json({ success: true, status: article.status });
});

module.exports = { dashboard, createNew, renderEdit, autosave, submit };
