// utils/logger.js
// לוגר פשוט לשגיאות ואירועים תפעוליים משמעותיים, כנדרש במסמך הדרישות.
// כותב גם לקונסולה וגם לקובץ logs/app.log כדי שיהיה תיעוד היסטורי.

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// רמת הלוג נקבעת מ-LOG_LEVEL ב-.env: info (ברירת מחדל, הכל), warn (אזהרות ושגיאות)
// או error (שגיאות בלבד). קוראים את המשתנה בכל כתיבה ולא פעם אחת בטעינה, כך שהקובץ
// עובד נכון גם אם dotenv נטען אחרי הלוגר.
const LEVEL_PRIORITY = { INFO: 1, WARN: 2, ERROR: 3 };

function minPriority() {
  const configured = String(process.env.LOG_LEVEL || 'info').toUpperCase();
  return LEVEL_PRIORITY[configured] || LEVEL_PRIORITY.INFO;
}

function write(level, message, meta) {
  if (LEVEL_PRIORITY[level] < minPriority()) return;
  const line = `[${new Date().toISOString()}] [${level}] ${message}${
    meta ? ' ' + JSON.stringify(meta) : ''
  }\n`;
  // כתיבה אסינכרונית כדי לא לחסום את לולאת האירועים של Node
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error('כשל בכתיבת לוג לקובץ:', err.message);
  });
  if (level === 'ERROR') {
    console.error(line.trim());
  } else {
    console.log(line.trim());
  }
}

module.exports = {
  info: (message, meta) => write('INFO', message, meta),
  warn: (message, meta) => write('WARN', message, meta),
  error: (message, meta) => write('ERROR', message, meta),
};
