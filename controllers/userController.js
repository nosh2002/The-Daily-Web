// controllers/userController.js
//
// ניהול חשבונות כתבים ע"י העורך. זהו ה-CRUD המלא הנדרש עבור מודל המשתמשים
// (Create/Read/Update/Delete) - עד כה משתמשים נוצרו רק דרך scripts/seed.js,
// כלומר לא היה שום נתיב באפליקציה עצמה ליצירה/עדכון/מחיקה של משתמש.
//
// בכוונה מוגבל לניהול כתבים (role=reporter) בלבד: העורך לא יכול לערוך/למחוק
// כאן את עצמו או עורך אחר דרך המסך הזה, כדי לא לאפשר בטעות מצב שבו אין אף
// עורך מחובר שיכול לתקן את זה בחזרה.

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Article = require('../models/Article');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

// GET /editor/users - Read (List)
const listReporters = asyncHandler(async (req, res) => {
  const reporters = await User.find({ role: ROLES.REPORTER }).sort({ createdAt: -1 }).lean();
  res.render('editor/users', { title: 'ניהול משתמשים', reporters });
});

// POST /editor/api/users - Create
const createReporter = asyncHandler(async (req, res, next) => {
  const { username, displayName, password } = req.body;

  if (!username || !username.trim() || !displayName || !displayName.trim() || !password) {
    return next(new AppError('יש למלא שם משתמש, שם תצוגה וסיסמה', 400));
  }
  if (String(password).length < 6) {
    return next(new AppError('הסיסמה חייבת להכיל לפחות 6 תווים', 400));
  }

  const normalizedUsername = username.trim().toLowerCase();
  const existing = await User.findOne({ username: normalizedUsername });
  if (existing) {
    return next(new AppError('שם המשתמש הזה כבר תפוס', 409));
  }

  const user = await User.createWithPassword({
    username: normalizedUsername,
    displayName: displayName.trim(),
    password: String(password),
    role: ROLES.REPORTER,
  });

  logger.info('נוצר חשבון כתב חדש', { username: user.username, by: req.session.user.username });

  res.status(201).json({
    success: true,
    user: { id: user._id, username: user.username, displayName: user.displayName },
  });
});

// PATCH /editor/api/users/:id - Update (שם תצוגה ו/או איפוס סיסמה)
const updateReporter = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, role: ROLES.REPORTER });
  if (!user) return next(new AppError('המשתמש לא נמצא', 404));

  const { displayName, password } = req.body;

  if (displayName !== undefined) {
    if (!displayName.trim()) return next(new AppError('שם תצוגה לא יכול להיות ריק', 400));
    user.displayName = displayName.trim();
  }

  if (password) {
    if (String(password).length < 6) {
      return next(new AppError('הסיסמה חייבת להכיל לפחות 6 תווים', 400));
    }
    user.passwordHash = await bcrypt.hash(String(password), 10);
  }

  await user.save();
  logger.info('חשבון כתב עודכן', { username: user.username, by: req.session.user.username });

  res.json({ success: true, user: { id: user._id, username: user.username, displayName: user.displayName } });
});

// DELETE /editor/api/users/:id - Delete
const deleteReporter = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, role: ROLES.REPORTER });
  if (!user) return next(new AppError('המשתמש לא נמצא', 404));

  // לא מוחקים כתב שיש לו כתבות משויכות - זה היה משאיר כתבות עם author "יתום"
  // ושובר את הצגת שם הכתב בכל מקום באתר (פיד, עמוד כתבה, לוחות הבקרה).
  const articleCount = await Article.countDocuments({ author: user._id });
  if (articleCount > 0) {
    return next(
      new AppError(
        `לא ניתן למחוק את הכתב "${user.displayName}" מכיוון שיש לו ${articleCount} כתבות במערכת. יש למחוק או להעביר את הכתבות שלו קודם.`,
        409
      )
    );
  }

  await User.deleteOne({ _id: user._id });
  logger.info('חשבון כתב נמחק', { username: user.username, by: req.session.user.username });

  res.json({ success: true });
});

module.exports = { listReporters, createReporter, updateReporter, deleteReporter };
