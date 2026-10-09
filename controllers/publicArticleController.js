// controllers/publicArticleController.js
// אזור הציבור: פיד החדשות ועמוד כתבה בודדת. כל הפעולות כאן עובדות אך ורק על
// article.published (תמונת המצב הפומבית) - לעולם לא על article.content הפנימי,
// כדי שאורח לעולם לא יראה טיוטה או תוכן שממתין לאישור.

const Article = require('../models/Article');
const Comment = require('../models/Comment');
const ViewStat = require('../models/ViewStat');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { CATEGORIES } = require('../utils/constants');

const PAGE_SIZE = 20;

// בריחה של תווים מיוחדים ב-regex לפני הזרקת קלט משתמש חופשי ל-$regex של MongoDB.
// בלי זה, חיפוש עם תו כמו "(" ללא סוגר תואם הוא ביטוי רגולרי לא-תקין וגורם
// לשגיאה מ-MongoDB (מקרה קצה סביר מאוד בחיפוש חופשי, לא תיאורטי).
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPublicFilter({ search, category, excludeIds }) {
  const filter = { 'published.isPublished': true };

  if (category && CATEGORIES.includes(category)) {
    filter['published.category'] = category;
  }

  if (search && search.trim()) {
    const safe = escapeRegExp(search.trim());
    // חיפוש "מכיל" (case-insensitive) בכותרת ובתקציר - נענה לדרישה של חיפוש חופשי
    filter.$or = [
      { 'published.title': { $regex: safe, $options: 'i' } },
      { 'published.summary': { $regex: safe, $options: 'i' } },
    ];
  }

  if (excludeIds && excludeIds.length) {
    filter._id = { $nin: excludeIds };
  }

  return filter;
}

// GET /api/articles - שימוש ע"י גלילה אינסופית + חיפוש/סינון/מיון בפיד הבית
const listArticles = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const sort = req.query.sort === 'popularity' ? { viewCount: -1 } : { 'published.publishedAt': -1 };
  const excludeIds = req.query.seenIds
    ? String(req.query.seenIds).split(',').filter(Boolean)
    : [];
  const onlyUnseen = req.query.seen === 'notseen';

  const filter = buildPublicFilter({
    search: req.query.search,
    category: req.query.category,
    excludeIds: onlyUnseen ? excludeIds : [],
  });

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select('published viewCount author')
      .populate('author', 'displayName')
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Article.countDocuments(filter),
  ]);

  res.json({
    success: true,
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: page * PAGE_SIZE < total,
    articles: articles.map((a) => ({
      id: a._id,
      title: a.published.title,
      summary: a.published.summary,
      category: a.published.category,
      imageUrl: a.published.imageUrl,
      publishedAt: a.published.publishedAt,
      viewCount: a.viewCount,
      reporterName: a.author ? a.author.displayName : 'מערכת',
    })),
  });
});

// GET / - עמוד הבית (SSR של המעטפת; התוכן עצמו נטען אחר כך דרך /api/articles)
const renderHome = asyncHandler(async (req, res) => {
  res.render('index', { title: 'The Daily Web', categories: CATEGORIES });
});

// GET /articles/:id - עמוד כתבה מלא, מרונדר בצד השרת (SEO) + רישום צפייה
const renderArticle = asyncHandler(async (req, res, next) => {
  const article = await Article.findById(req.params.id)
    .populate('author', 'displayName')
    .lean();

  if (!article || !article.published || !article.published.isPublished) {
    return next(new AppError('הכתבה לא נמצאה או שאינה פורסמת', 404));
  }

  // רישום צפייה - אטומי וזול, ראו הסבר עיצובי במודל ViewStat
  Article.updateOne({ _id: article._id }, { $inc: { viewCount: 1 } }).exec();
  ViewStat.recordView(article._id).catch(() => {});

  const comments = await Comment.find({ article: article._id }).sort({ createdAt: 1 }).lean();

  res.render('article', {
    title: article.published.title,
    article,
    comments,
  });
});

module.exports = { listArticles, renderHome, renderArticle };
