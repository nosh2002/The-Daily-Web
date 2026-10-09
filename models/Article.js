// models/Article.js
//
// עיצוב מרכזי: לכתבה יש שתי "שכבות" תוכן נפרדות -
//
// 1. content   - התוכן העדכני שעליו עובד הכתב כרגע (הטיוטה/הגרסה בבדיקה).
// 2. published - "תמונת מצב" (snapshot) של הגרסה האחרונה שאושרה ופורסמה בפועל.
//                זהו התוכן שהציבור רואה, ואינו משתנה עד שעורך מאשר גרסה חדשה.
//
// כך אפשר לענות בדיוק על הדרישה: "כאשר כתב מתחיל לערוך כתבה קיימת שכבר פורסמה -
// ציבור הקוראים ימשיך לראות את הגרסה האחרונה שאושרה, והשינויים לא יופיעו באתר
// הציבורי עד אישור עורך חדש". status מתאר את מצב זרימת העבודה (workflow) של
// content, ואילו published.isPublished מתאר האם יש בכלל גרסה פומבית להציג.

const mongoose = require('mongoose');
const { ARTICLE_STATUS, CATEGORIES } = require('../utils/constants');

// שימו לב: summary ו-body אינם מסומנים כ-required ברמת הסכמה, במכוון - כתבה
// חדשה נוצרת ריקה (טיוטה) ועדיין צריכה להישמר בהצלחה כדי שהכתב יוכל להתחיל
// למלא אותה בעריכה. הבדיקה שהשדות אכן מלאים מתבצעת בנקודה הנכונה מבחינה
// עסקית - בשליחה לאישור עורך (ראו reporterController.submit), לא ביצירה.
const contentFieldsSchema = {
  title: { type: String, required: true, trim: true, maxlength: 200 },
  summary: { type: String, default: '', trim: true, maxlength: 400 },
  body: { type: String, default: '' },
  category: { type: String, required: true, enum: CATEGORIES },
  imageUrl: { type: String, default: '/img/placeholder.svg' },
};

const articleSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // התוכן העדכני (הגרסה שנמצאת כרגע בעבודה/בבדיקה)
    content: {
      ...contentFieldsSchema,
    },

    status: {
      type: String,
      enum: Object.values(ARTICLE_STATUS),
      default: ARTICLE_STATUS.DRAFT,
      required: true,
    },

    // הערת העורך כאשר הכתבה הוחזרה לתיקונים
    editorNote: { type: String, default: '' },

    // מי אישר/דחה לאחרונה
    lastHandledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // תמונת המצב הפומבית - מה שהציבור רואה בפועל. undefined/isPublished=false
    // כל עוד הכתבה מעולם לא פורסמה.
    published: {
      isPublished: { type: Boolean, default: false },
      title: String,
      summary: String,
      body: String,
      category: String,
      imageUrl: String,
      publishedAt: Date,
      publishedByVersion: { type: Number, default: 0 }, // כמה פעמים פורסם/עודכן בפומבי
    },

    // מונה צפיות מצטבר (למהירות תצוגה בפיד) - הנתונים המפורטים לאורך זמן
    // נשמרים בנפרד במודל ViewStat, ראו שם הסבר על שיקולי קנה-מידה.
    viewCount: { type: Number, default: 0 },

    // תמיכה בהמשכיות עבודה - חותמת הזמן של השמירה האוטומטית האחרונה
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// אינדקסים לתמיכה בחיפוש/סינון/מיון יעילים גם עם אלפי כתבות
articleSchema.index({ 'content.title': 'text', 'published.title': 'text' });
articleSchema.index({ status: 1, author: 1 });
articleSchema.index({ 'published.isPublished': 1, 'published.publishedAt': -1 });
articleSchema.index({ 'published.isPublished': 1, viewCount: -1 });
articleSchema.index({ 'published.category': 1 });

module.exports = mongoose.model('Article', articleSchema);
