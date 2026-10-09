// server.js - נקודת הכניסה של האפליקציה: הרכבת כל חלקי ה-MVC יחד.
require('dotenv').config();

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB = require('./config/db');
const deviceIdMiddleware = require('./middleware/deviceId');
const { attachUserToLocals } = require('./middleware/auth');
const { errorHandler, AppError } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const reporterRoutes = require('./routes/reporterRoutes');
const editorRoutes = require('./routes/editorRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const legalRoutes = require('./routes/legalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the-daily-web';

// רשת ביטחון גלובלית: שגיאה לא צפויה בשום מקום בקוד (כולל שגיאות רשת פנימיות
// של דרייבר ה-MongoDB) תירשם ביומן ותסגור את התהליך בצורה מבוקרת, במקום
// שהשרת "יתרסק" עם stack trace לא ברור למשתמש. כנדרש: פעולות/נתונים שגויים
// לא יגרמו לקריסת השרת ללא תיעוד.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection - ייתכן שה-MongoDB המקומי אינו פועל', {
    message: reason && reason.message ? reason.message : String(reason),
  });
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

// --- View engine (MVC - View) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware גלובלי ---
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  '/vendor/chart.js',
  express.static(path.join(__dirname, 'node_modules/chart.js/dist'))
);

// session מבוסס MongoDB (connect-mongo): כך אם השרת עושה restart, ה-session
// עדיין קיים במסד הנתונים ומשתמש שכבר התחבר לא יצטרך להתחבר מחדש - בדיוק
// כנדרש: "אם השרת מבצע Restart, משתמש שכבר הזדהה למערכת צריך להיות מסוגל
// להמשיך להשתמש בה כרגיל, ללא צורך בהתחברות מחדש".
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: 'sessions' }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // שבוע
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(deviceIdMiddleware);
app.use(attachUserToLocals);

// --- Routes (MVC - Controller, דרך ה-routers) ---
app.use('/', authRoutes);
app.use('/', articleRoutes); // כולל גם /api/articles הציבורי
app.use('/reporter', reporterRoutes);
app.use('/editor', editorRoutes);
app.use('/', weatherRoutes);
app.use('/', legalRoutes);

// 404 - כל מה שלא נתפס ע"י אף route
app.use((req, res, next) => {
  next(new AppError('העמוד המבוקש לא נמצא', 404));
});

// Error handler מרכזי - תמיד אחרון
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`השרת פועל על http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('כשל בהפעלת השרת', { error: err.message });
    process.exit(1);
  }
}

start();

module.exports = app;
