// config/db.js
// אחראי אך ורק על החיבור למסד הנתונים MongoDB דרך Mongoose.
// הפרדה זו היא חלק מהארכיטקטורה - קובץ ה-config לא יודע כלום על Express או על ה-routes.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the-daily-web';

  mongoose.connection.on('connected', () => {
    console.log(`[DB] מחובר למסד הנתונים: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] שגיאת חיבור למסד הנתונים:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] החיבור למסד הנתונים נותק');
  });

  // serverSelectionTimeoutMS מקוצר (8 שניות במקום ברירת המחדל 30) - כך אם
  // שכחתם להפעיל את שירות ה-MongoDB המקומי, תקבלו שגיאה ברורה במהירות
  // במקום להמתין חצי דקה בלי לדעת מה קורה.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}

module.exports = connectDB;
