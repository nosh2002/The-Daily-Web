// middleware/loginRateLimiter.js
// הגבלת ניסיונות התחברות כושלים לפי כתובת IP, כדי להקשות על ניחוש סיסמאות
// (brute force). בדומה ל-commentRateLimiter אנחנו משתמשים ב"חלון הזזה": סופרים
// רק ניסיונות כושלים מהדקה האחרונה, ומעל המגבלה חוסמים זמנית.
//
// חשוב: ההגבלה נשמרת בזיכרון התהליך. אחרי restart של השרת היא מתאפסת, ואם היו
// כמה שרתים כל אחד היה סופר בנפרד. לפרויקט עם שרת אחד זה מספיק; בייצור היינו
// שומרים את המונים במאגר משותף כמו Redis.

const logger = require('../utils/logger');

const WINDOW_MS = 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

const failures = new Map(); // ip -> מערך חותמות זמן (ms) של ניסיונות כושלים

function recentOnly(timestamps, now) {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

// middleware שרץ לפני ה-controller של ההתחברות: אם כבר היו יותר מדי כשלונות
// מאותו IP, לא מגיעים בכלל לבדיקת הסיסמה.
function loginRateLimiter(req, res, next) {
  const now = Date.now();
  const recent = recentOnly(failures.get(req.ip) || [], now);

  if (recent.length >= MAX_FAILED_ATTEMPTS) {
    logger.warn('התחברות נחסמה עקב יותר מדי ניסיונות כושלים', { ip: req.ip });
    return res.status(429).render('login', {
      title: 'התחברות',
      error: 'יותר מדי ניסיונות התחברות כושלים. נסו שוב בעוד דקה.',
      nextUrl: (req.body && req.body.next) || '',
    });
  }
  return next();
}

// נקראת מה-controller אחרי ניסיון כושל
function recordFailedLogin(req) {
  const now = Date.now();
  const recent = recentOnly(failures.get(req.ip) || [], now);
  recent.push(now);
  failures.set(req.ip, recent);
}

// נקראת אחרי התחברות מוצלחת, כדי שמשתמש אמיתי לא ייחסם בגלל טעויות קודמות
function clearFailedLogins(req) {
  failures.delete(req.ip);
}

// ניקוי תקופתי למניעת דליפת זיכרון. unref() מאפשר לתהליך להיסגר בלי להמתין לטיימר.
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of failures.entries()) {
    const remaining = recentOnly(timestamps, now);
    if (remaining.length === 0) failures.delete(ip);
    else failures.set(ip, remaining);
  }
}, 5 * 60 * 1000).unref();

module.exports = { loginRateLimiter, recordFailedLogin, clearFailedLogins };
