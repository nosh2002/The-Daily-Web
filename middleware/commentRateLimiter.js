// middleware/commentRateLimiter.js
//
// הגבלת ספאם: אורח יכול לפרסם לכל היותר 3 תגובות בדקה מאותו מכשיר.
// המימוש הוא "sliding window" בזיכרון: לכל מפתח (deviceId+IP) שומרים מערך של
// חותמות זמן (timestamps) של התגובות האחרונות. בכל בקשה חדשה מסננים החוצה
// חותמות ישנות מ-60 שניות, ובודקים אם נשארו פחות מ-3. פתרון בזיכרון מספיק כאן
// כי זו הגנה נגד ספאם מיידי ולא נתון עסקי שצריך לשרוד restart של השרת.
//
// לתרחיש ריבוי-שרתים (scale-out אמיתי) היינו עוברים לאחסון משותף כמו Redis,
// אך עבור פרויקט זה שרת יחיד זהו פתרון תקין ופשוט.

const WINDOW_MS = 60 * 1000;
const MAX_IN_WINDOW = 3;

const hits = new Map(); // key -> array of timestamps (ms)

function keyFor(req) {
  return `${req.deviceId}:${req.ip}`;
}

function cleanup(timestamps, now) {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

function commentRateLimiter(req, res, next) {
  const key = keyFor(req);
  const now = Date.now();
  const existing = cleanup(hits.get(key) || [], now);

  if (existing.length >= MAX_IN_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'שלחת יותר מדי תגובות בזמן קצר. נסה שוב בעוד דקה.',
    });
  }

  existing.push(now);
  hits.set(key, existing);
  next();
}

// ניקוי תקופתי של מפתחות ישנים כדי שהמפה לא תגדל ללא הגבלה בזמן ריצה ארוכה
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits.entries()) {
    const remaining = cleanup(timestamps, now);
    if (remaining.length === 0) hits.delete(key);
    else hits.set(key, remaining);
  }
}, 5 * 60 * 1000).unref();

module.exports = commentRateLimiter;
