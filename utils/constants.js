// utils/constants.js
// קבועים משותפים לכל המערכת - מצבי כתבה, קטגוריות ותפקידי משתמשים.
// ריכוז במקום אחד מונע "מחרוזות קסם" מפוזרות בקוד ומקל על תחזוקה.

const ARTICLE_STATUS = {
  DRAFT: 'draft', // בהכנה
  PENDING: 'pending', // ממתינה לאישור עורך
  PUBLISHED: 'published', // פורסמה
  RETURNED: 'returned', // הוחזרה לתיקונים
};

const STATUS_LABELS_HE = {
  [ARTICLE_STATUS.DRAFT]: 'בהכנה',
  [ARTICLE_STATUS.PENDING]: 'ממתינה לאישור עורך',
  [ARTICLE_STATUS.PUBLISHED]: 'פורסמה',
  [ARTICLE_STATUS.RETURNED]: 'הוחזרה לתיקונים',
};

// מפת המעברים המותרים בין מצבי כתבה, בהתאם למסמך הדרישות.
// כל מעבר אחר שאינו מופיע כאן ייחסם בצד השרת.
const ALLOWED_TRANSITIONS = {
  [ARTICLE_STATUS.DRAFT]: [ARTICLE_STATUS.PENDING],
  [ARTICLE_STATUS.PENDING]: [ARTICLE_STATUS.PUBLISHED, ARTICLE_STATUS.RETURNED],
  [ARTICLE_STATUS.RETURNED]: [ARTICLE_STATUS.PENDING],
  // עריכת כתבה שכבר פורסמה ושליחתה מחדש לאישור - הכתבה עצמה נשארת "פורסמה" כלפי
  // הציבור (publishedSnapshot לא משתנה), אך מצב זרימת העבודה (status) עובר ל-pending.
  [ARTICLE_STATUS.PUBLISHED]: [ARTICLE_STATUS.PENDING],
};

const CATEGORIES = [
  'חדשות',
  'פוליטיקה',
  'כלכלה',
  'ספורט',
  'טכנולוגיה',
  'תרבות',
  'בריאות',
  'עולם',
];

const ROLES = {
  REPORTER: 'reporter',
  EDITOR: 'editor',
};

const ROLE_LABELS_HE = {
  [ROLES.REPORTER]: 'כתב',
  [ROLES.EDITOR]: 'עורך',
};

module.exports = {
  ARTICLE_STATUS,
  STATUS_LABELS_HE,
  ALLOWED_TRANSITIONS,
  CATEGORIES,
  ROLES,
  ROLE_LABELS_HE,
};
