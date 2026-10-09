// scripts/seed.js
//
// מזין למערכת נתוני הדגמה כנדרש לפני ההגנה: כ-500 כתבות במצבים/קטגוריות שונות,
// משתמשי כתב ועורך, תגובות, וכן נתוני צפייה לאורך זמן (כולל סביב נקודות
// פרסום/עדכון) כדי שגרף ה-Impact Analytics יהיה משמעותי להצגה.
//
// הרצה: npm run seed  (חובה שה-.env יהיה מוגדר ושה-MongoDB רץ)

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const ViewStat = require('../models/ViewStat');
const PublishEvent = require('../models/PublishEvent');

const { ARTICLE_STATUS, CATEGORIES, ROLES } = require('../utils/constants');
const rc = require('../utils/randomContent');

const TOTAL_ARTICLES = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

function randomDateWithinLastDays(days) {
  return new Date(Date.now() - rc.randomInt(0, days * DAY_MS));
}

// מיפוי קטגוריה -> מילות חיפוש לשירות התמונות, כדי שהתמונה הראשית של כל
// כתבה תהיה רלוונטית לנושא הכתבה בפועל (ולא תמונה אקראית לגמרי שלא קשורה
// לתוכן, כפי שהיה קודם עם picsum.photos שאינו תומך בחיפוש לפי נושא).
const CATEGORY_IMAGE_KEYWORDS = {
  חדשות: 'news,newspaper',
  פוליטיקה: 'politics,government',
  כלכלה: 'finance,business',
  ספורט: 'sports,stadium',
  טכנולוגיה: 'technology,computer',
  תרבות: 'culture,art',
  בריאות: 'health,hospital',
  עולם: 'world,globe',
};

// הופך את ה-seed (מזהה כתבה/גרסה) למספר קבוע, כדי שאותה כתבה תמיד תקבל
// את אותה תמונה (עקביות בין רינדורים חוזרים), אך כתבות שונות יקבלו תמונות שונות
function hashSeed(seed) {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % 10000;
}

function imageFor(seed, category) {
  const keywords = CATEGORY_IMAGE_KEYWORDS[category] || 'news';
  const lock = hashSeed(seed);
  // LoremFlickr מספק תמונות סטוק אמיתיות (לא AI) לפי מילות חיפוש, בניגוד
  // ל-picsum.photos שמחזיר תמונה אקראית לחלוטין ללא קשר לתוכן
  return `https://loremflickr.com/800/450/${keywords}?lock=${lock}`;
}

async function createUsers() {
  const reporters = [];
  for (let i = 1; i <= 4; i += 1) {
    const reporter = await User.createWithPassword({
      username: `reporter${i}`,
      displayName: rc.generatePersonName(),
      password: 'password123',
      role: ROLES.REPORTER,
    });
    reporters.push(reporter);
  }
  const editor = await User.createWithPassword({
    username: 'editor1',
    displayName: rc.generatePersonName(),
    password: 'password123',
    role: ROLES.EDITOR,
  });
  return { reporters, editor };
}

function randomContentBlock(seedIndex) {
  const category = rc.choice(CATEGORIES);
  const title = rc.generateTitle(category);
  return {
    title,
    summary: rc.generateSummary(title),
    body: rc.generateBody(rc.randomInt(4, 8)),
    category,
    imageUrl: imageFor(seedIndex, category),
  };
}

// יוצר סדרת צפיות לאורך זמן עבור כתבה שפורסמה, עם "עלייה" סביב נקודות פרסום/עדכון
async function generateViewSeries(articleId, publishedAt, updateTimestamps) {
  const now = Date.now();
  const start = publishedAt.getTime();
  const totalHours = Math.max(1, Math.floor((now - start) / (60 * 60 * 1000)));
  const stepHours = totalHours > 24 * 20 ? rc.randomInt(8, 16) : rc.randomInt(2, 5); // דילול לכתבות ישנות כדי לא ליצור יותר מדי מסמכים

  const ops = [];
  let totalViews = 0;
  const boostWindows = updateTimestamps.map((t) => t.getTime());

  for (let h = 0; h <= totalHours; h += stepHours) {
    const bucketTime = new Date(start + h * 60 * 60 * 1000);
    let base = rc.randomInt(1, 25);

    // "בוסט" של צפיות בסמוך לכל אירוע פרסום/עדכון, כדי שהגרף יראה בבירור
    // את ההשפעה של עדכון על כמות הצפיות - בדיוק מה שהדרישה מבקשת להדגים
    boostWindows.forEach((t) => {
      const hoursSinceEvent = (bucketTime.getTime() - t) / (60 * 60 * 1000);
      if (hoursSinceEvent >= 0 && hoursSinceEvent < 12) {
        base += Math.round(rc.randomInt(30, 90) * (1 - hoursSinceEvent / 12));
      }
    });

    totalViews += base;
    ops.push({
      updateOne: {
        filter: { article: articleId, hourBucket: ViewStat.roundToHour(bucketTime) },
        update: { $set: { count: base } },
        upsert: true,
      },
    });
  }

  if (ops.length) await ViewStat.bulkWrite(ops);
  return totalViews;
}

async function seedArticles(reporters, editor) {
  const statusPlan = [];
  // התפלגות מצבים: רוב הכתבות פורסמו, חלק ממתינות/בטיוטה/הוחזרו
  for (let i = 0; i < TOTAL_ARTICLES; i += 1) {
    const r = Math.random();
    if (r < 0.68) statusPlan.push(ARTICLE_STATUS.PUBLISHED);
    else if (r < 0.8) statusPlan.push(ARTICLE_STATUS.PENDING);
    else if (r < 0.92) statusPlan.push(ARTICLE_STATUS.DRAFT);
    else statusPlan.push(ARTICLE_STATUS.RETURNED);
  }

  let createdCount = 0;
  let multiRevisionCount = 0;

  for (let i = 0; i < TOTAL_ARTICLES; i += 1) {
    const targetStatus = statusPlan[i];
    const author = rc.choice(reporters);
    const content = randomContentBlock(i);

    const articleDoc = {
      author: author._id,
      content,
      status: ARTICLE_STATUS.DRAFT,
      published: { isPublished: false, publishedByVersion: 0 },
    };

    if (targetStatus === ARTICLE_STATUS.RETURNED) {
      articleDoc.status = ARTICLE_STATUS.RETURNED;
      articleDoc.editorNote = 'יש להרחיב את הפתיחה ולהוסיף מקור נוסף לאימות העובדות.';
      articleDoc.lastHandledBy = editor._id;
    } else if (targetStatus === ARTICLE_STATUS.PENDING) {
      articleDoc.status = ARTICLE_STATUS.PENDING;
    }

    const article = await Article.create(articleDoc);

    if (targetStatus === ARTICLE_STATUS.PUBLISHED) {
      // כ-15% מהכתבות שפורסמו עוברות מספר עדכונים לאחר הפרסום, כנדרש בדרישות ההדגמה
      const revisions = Math.random() < 0.15 ? rc.randomInt(2, 4) : 1;
      const firstPublish = randomDateWithinLastDays(45);
      const publishTimestamps = [firstPublish];

      let lastContent = content;
      for (let v = 2; v <= revisions; v += 1) {
        const gap = rc.randomInt(2, 10) * DAY_MS;
        const next = new Date(Math.min(Date.now() - DAY_MS, publishTimestamps[publishTimestamps.length - 1].getTime() + gap));
        publishTimestamps.push(next);
        lastContent = randomContentBlock(`${i}-v${v}`);
      }

      article.content = lastContent;
      article.published = {
        isPublished: true,
        title: lastContent.title,
        summary: lastContent.summary,
        body: lastContent.body,
        category: lastContent.category,
        imageUrl: lastContent.imageUrl,
        publishedAt: publishTimestamps[publishTimestamps.length - 1],
        publishedByVersion: revisions,
      };
      article.status = ARTICLE_STATUS.PUBLISHED;
      article.lastHandledBy = editor._id;
      await article.save();

      const publishEventDocs = publishTimestamps.map((t, idx) => ({
        article: article._id,
        publishedAt: t,
        version: idx + 1,
        editor: editor._id,
      }));
      await PublishEvent.insertMany(publishEventDocs);

      const totalViews = await generateViewSeries(article._id, publishTimestamps[0], publishTimestamps.slice(1));
      article.viewCount = totalViews;
      await article.save();

      if (revisions > 1) multiRevisionCount += 1;

      // תגובות אקראיות על כתבות שפורסמו
      const commentCount = rc.randomInt(0, 8);
      const commentDocs = [];
      for (let c = 0; c < commentCount; c += 1) {
        commentDocs.push({
          article: article._id,
          authorName: rc.generatePersonName(),
          text: rc.generateComment(),
          deviceId: `seed-device-${i}-${c}`,
          createdAt: new Date(article.published.publishedAt.getTime() + rc.randomInt(1, 10) * 60 * 60 * 1000),
        });
      }
      if (commentDocs.length) await Comment.insertMany(commentDocs);
    }

    createdCount += 1;
    if (createdCount % 100 === 0) {
      console.log(`  ...נוצרו ${createdCount}/${TOTAL_ARTICLES} כתבות`);
    }
  }

  console.log(`  כתבות עם מספר עדכונים לאחר פרסום: ${multiRevisionCount}`);
}

async function run() {
  await connectDB();
  console.log('מוחק נתונים קיימים...');
  await Promise.all([
    User.deleteMany({}),
    Article.deleteMany({}),
    Comment.deleteMany({}),
    ViewStat.deleteMany({}),
    PublishEvent.deleteMany({}),
  ]);

  console.log('יוצר משתמשים (כתבים + עורך)...');
  const { reporters, editor } = await createUsers();

  console.log(`יוצר ${TOTAL_ARTICLES} כתבות הדגמה, זה עשוי לקחת מספר דקות...`);
  await seedArticles(reporters, editor);

  console.log('\nהזנת נתוני הדגמה הושלמה בהצלחה!');
  console.log('משתמשי הדגמה:');
  reporters.forEach((r) => console.log(`  כתב: ${r.username} / password123`));
  console.log(`  עורך: ${editor.username} / password123`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('שגיאה בהזנת נתוני ההדגמה:', err);
  process.exit(1);
});
