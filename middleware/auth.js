// middleware/auth.js
//
// חשוב: כל בדיקות ההרשאה מתבצעות כאן, בצד השרת, על בסיס req.session.user
// שנקבע רק בעת התחברות מוצלחת (ראו authController). לעולם לא מסתמכים על מידע
// שמגיע מהלקוח (כגון body.role או header) כדי לקבוע הרשאות - זו בדיוק הדרישה:
// "הרשאות המשתמש ייקבעו לפי המשתמש המזוהה ולא לפי מידע שניתן לשנות ידנית
// בדפדפן". גם אם מישהו יסתיר כפתור ב-CSS/JS, השרת עדיין יחסום את הבקשה.

const { AppError, isApiRequest } = require('./errorHandler');
const { ROLES } = require('../utils/constants');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    if (isApiRequest(req)) {
      return next(new AppError('יש להתחבר כדי לבצע פעולה זו', 401));
    }
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      if (isApiRequest(req)) {
        return next(new AppError('יש להתחבר כדי לבצע פעולה זו', 401));
      }
      return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
    }
    if (!roles.includes(req.session.user.role)) {
      return next(new AppError('אין לך הרשאה לבצע פעולה זו', 403));
    }
    return next();
  };
}

const requireReporter = requireRole(ROLES.REPORTER);
const requireEditor = requireRole(ROLES.EDITOR);

// מזין את req.locals עם משתמש נוח לשימוש ב-views (navbar וכו')
function attachUserToLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

module.exports = { requireLogin, requireRole, requireReporter, requireEditor, attachUserToLocals };
