// middleware/deviceId.js
// מזהה מכשיר אנונימי, נשמר ב-cookie ארוך טווח, ומשמש בשילוב עם כתובת ה-IP
// לאכיפת הגבלת הספאם על תגובות ("3 תגובות בדקה מאותו מכשיר"). עוגייה בלבד
// אינה מספיקה (אפשר למחוק אותה), ולכן משלבים גם IP - ראו middleware/commentRateLimiter.js

const crypto = require('crypto');

const COOKIE_NAME = 'deviceId';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function deviceIdMiddleware(req, res, next) {
  let id = req.cookies && req.cookies[COOKIE_NAME];
  if (!id) {
    id = crypto.randomUUID();
    res.cookie(COOKIE_NAME, id, {
      maxAge: ONE_YEAR_MS,
      httpOnly: true,
      sameSite: 'lax',
    });
  }
  req.deviceId = id;
  next();
}

module.exports = deviceIdMiddleware;
