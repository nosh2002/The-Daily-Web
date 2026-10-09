// controllers/statsController.js
const Article = require('../models/Article');
const ViewStat = require('../models/ViewStat');
const PublishEvent = require('../models/PublishEvent');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// כדי שהרשימה הנפתחת תישאר שמישה גם עם אלפי כתבות מפורסמות, מציגים רק את
// המובילות בצפיות (ממילא בורר יחיד עם אלפי אפשרויות אינו שמיש בשום מקרה) -
// כתבה ספציפית עדיין נגישה ישירות דרך /editor/stats/:id גם אם אינה ברשימה.
const STATS_PICKER_LIMIT = 200;

// GET /editor/stats - עמוד בחירת כתבה לצפייה בגרף
const renderStatsPicker = asyncHandler(async (req, res) => {
  const articles = await Article.find({ 'published.isPublished': true })
    .select('published.title viewCount')
    .sort({ viewCount: -1 })
    .limit(STATS_PICKER_LIMIT)
    .lean();
  res.render('editor/stats', { title: 'אנליטיקס צפיות', articles, selectedId: null, article: null });
});

// GET /editor/stats/:id - הגרף עבור כתבה ספציפית
const renderStatsForArticle = asyncHandler(async (req, res, next) => {
  const [articles, article] = await Promise.all([
    Article.find({ 'published.isPublished': true })
      .select('published.title viewCount')
      .sort({ viewCount: -1 })
      .limit(STATS_PICKER_LIMIT)
      .lean(),
    Article.findById(req.params.id).lean(),
  ]);
  if (!article) return next(new AppError('הכתבה לא נמצאה', 404));

  res.render('editor/stats', {
    title: 'אנליטיקס צפיות',
    articles,
    selectedId: req.params.id,
    article,
  });
});

// GET /api/stats/articles/:id - נתוני סדרת הזמן + נקודות הפרסום, לצריכת Chart.js
const getArticleStats = asyncHandler(async (req, res, next) => {
  const article = await Article.findById(req.params.id).select('published viewCount').lean();
  if (!article) return next(new AppError('הכתבה לא נמצאה', 404));

  const [series, publishEvents] = await Promise.all([
    ViewStat.getTimeSeries(article._id),
    PublishEvent.find({ article: article._id }).sort({ publishedAt: 1 }).lean(),
  ]);

  res.json({
    success: true,
    title: article.published.title,
    totalViews: article.viewCount,
    series: series.map((s) => ({ t: s.hourBucket, count: s.count })),
    publishEvents: publishEvents.map((p) => ({ t: p.publishedAt, version: p.version })),
  });
});

module.exports = { renderStatsPicker, renderStatsForArticle, getArticleStats };
