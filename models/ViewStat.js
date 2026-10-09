// models/ViewStat.js
//
// שיקול עיצוב מרכזי (רלוונטי מאוד להסבר בהגנה):
// המסמך דורש "להניח שהאתר עשוי לשרת אלפי קוראים במקביל" ולתמוך בגרף שמראה כמות
// צפיות לאורך זמן. הפתרון הנאיבי - ליצור מסמך (document) חדש במסד הנתונים על כל
// צפייה בודדת - היה יוצר עומס כתיבה עצום וכמות עצומה של מסמכים (מיליוני רשומות
// עבור כתבה פופולרית אחת), וגם היה הופך שאילתת "כמה צפיות היו בכל שעה" לאיטית.
//
// לכן, במקום מסמך לכל צפייה, אנו "צוברים" (bucket) את הצפיות: לכל כתבה ולכל שעה
// עגולה (hourBucket) יש מסמך יחיד עם מונה. צפייה חדשה מבצעת פעולת עדכון אטומית
// יחידה - findOneAndUpdate עם $inc ו-upsert:true - שהיא זולה, מהירה, ובטוחה גם
// תחת עומס בו-זמני גבוה (אין race condition כי ה-$inc אטומי ברמת המסד נתונים).
// כך מספר המסמכים גדל לכל היותר ב-24 בשעה לכל כתבה, ללא קשר לכמות הצפיות בפועל.

const mongoose = require('mongoose');

const viewStatSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  // תחילת השעה העגולה (לדוגמה 14:00:00.000) אליה שייכת הצפייה
  hourBucket: { type: Date, required: true },
  count: { type: Number, default: 0 },
});

viewStatSchema.index({ article: 1, hourBucket: 1 }, { unique: true });

function roundToHour(date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

// רישום צפייה בודדת בכתבה - קריאה זולה ואטומית שאפשר לקרוא לה בכל טעינת עמוד כתבה
viewStatSchema.statics.recordView = async function recordView(articleId, when = new Date()) {
  const hourBucket = roundToHour(when);
  await this.findOneAndUpdate(
    { article: articleId, hourBucket },
    { $inc: { count: 1 } },
    { upsert: true }
  );
};

// שליפת סדרת הזמן המלאה לכתבה נתונה, ממוינת כרונולוגית - לשימוש בגרף Impact Analytics
viewStatSchema.statics.getTimeSeries = function getTimeSeries(articleId) {
  return this.find({ article: articleId }).sort({ hourBucket: 1 }).lean();
};

viewStatSchema.statics.roundToHour = roundToHour;

module.exports = mongoose.model('ViewStat', viewStatSchema);
