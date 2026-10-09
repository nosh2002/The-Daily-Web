// controllers/weatherController.js
//
// אינטגרציה עם שירות מזג אוויר חיצוני (OpenWeatherMap - חינמי, ללא צורך בכרטיס
// אשראי). השרת פועל כ-proxy: הלקוח (JavaScript בדפדפן) אף פעם לא פונה ישירות
// ל-API החיצוני ולא רואה את מפתח ה-API - כך המפתח נשאר סודי בצד השרת בלבד.
//
// המסמך מתיר פיגור של עד 15 דקות בנתונים, ולכן אנו שומרים cache פשוט בזיכרון
// למשך 15 דקות: כך גם לא מציפים את ה-API החיצוני בבקשות כאשר אלפי משתמשים
// טוענים את האתר בו-זמנית - כולם מקבלים את אותה תוצאה שמורה.

const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

async function fetchFromOpenWeather() {
  const apiKey = process.env.WEATHER_API_KEY;
  // השם שנשלח ל-API חייב להיות באנגלית (כך ש-OpenWeatherMap ימצא את העיר),
  // אבל שם התצוגה למשתמש הוא בעברית בנפרד - כי json.name שחוזר מה-API הוא
  // תמיד באנגלית (הפרמטר lang משפיע רק על תיאור מזג האוויר, לא על שם העיר).
  const city = process.env.WEATHER_CITY || 'Tel Aviv,IL';
  const cityDisplayName = process.env.WEATHER_CITY_HE || 'תל אביב';

  if (!apiKey) {
    return { available: false, reason: 'no-api-key' };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=metric&lang=he&appid=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeatherMap הגיב עם סטטוס ${response.status}`);
  }
  const json = await response.json();

  return {
    available: true,
    city: cityDisplayName,
    tempC: Math.round(json.main.temp),
    description: json.weather && json.weather[0] ? json.weather[0].description : '',
    icon: json.weather && json.weather[0] ? json.weather[0].icon : null,
    humidity: json.main.humidity,
  };
}

// GET /api/weather
const getWeather = asyncHandler(async (req, res) => {
  const now = Date.now();

  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json({ ...cache.data, cached: true, fetchedAt: cache.fetchedAt });
  }

  try {
    const data = await fetchFromOpenWeather();
    cache = { data, fetchedAt: now };
    return res.json({ ...data, cached: false, fetchedAt: now });
  } catch (err) {
    logger.error('שגיאה בשליפת מזג אוויר', { error: err.message });
    // אם יש נתון ישן במטמון - עדיף להציג אותו מאשר שגיאה
    if (cache.data) {
      return res.json({ ...cache.data, cached: true, stale: true, fetchedAt: cache.fetchedAt });
    }
    return res.json({ available: false, reason: 'fetch-error' });
  }
});

module.exports = { getWeather };
