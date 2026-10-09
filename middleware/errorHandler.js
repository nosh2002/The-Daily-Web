// middleware/errorHandler.js
const logger = require('../utils/logger');

// שגיאה מותאמת אישית עם קוד סטטוס HTTP, כדי שנוכל לזרוק new AppError('...', 404)
// מכל מקום בקוד ולתת ל-Express Error Handler הגלובלי לטפל בה במקום אחד.
// בקשת API היא כל כתובת שמכילה את הקטע /api/ - כולל /editor/api/... ו-/reporter/api/...
// (בדיקה ב-startsWith בלבד פספסה אותן, והלקוח קיבל עמוד HTML במקום JSON עם הודעת השגיאה).
function isApiRequest(req) {
  return req.originalUrl.split('?')[0].includes('/api/');
}

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// עוטף async route handlers כדי שחריגה (exception) בתוך async function תיתפס
// אוטומטית ותועבר ל-next(err), בלי try/catch חוזר בכל controller.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware מרכזי לטיפול בשגיאות - מבטיח שאף שגיאה לא תפיל את השרת כולו,
// כנדרש: "פעולות שאינן מורשות או נתונים שאינם תקינים לא יגרמו לקריסת השרת".
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'שגיאה פנימית בשרת, נסו שוב מאוחר יותר';

  if (statusCode >= 500) {
    logger.error(message, { path: req.originalUrl, method: req.method, stack: err.stack });
  } else {
    logger.warn(message, { path: req.originalUrl, method: req.method });
  }

  if (isApiRequest(req)) {
    return res.status(statusCode).json({ success: false, message });
  }

  return res.status(statusCode).render('error', {
    title: 'שגיאה',
    statusCode,
    message,
    user: req.session ? req.session.user : null,
  });
}

module.exports = { AppError, asyncHandler, errorHandler, isApiRequest };
