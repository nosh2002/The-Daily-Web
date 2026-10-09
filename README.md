# The Daily Web

<div dir="rtl" align="right">
<p>מערכת אינטרנטית לניהול, עריכה ופרסום חדשות - פרויקט גמר בקורס פיתוח אפליקציות
אינטרנטיות.</p>
</div>

## תוכן עניינים

<div dir="rtl" align="right">
<ol dir="rtl">
<li><a href="#דרישות-מקדימות">דרישות מקדימות</a></li>
<li><a href="#התקנה-והרצה">התקנה והרצה</a></li>
<li><a href="#משתמשי-הדגמה">משתמשי הדגמה</a></li>
<li><a href="#מבנה-הפרויקט">מבנה הפרויקט</a></li>
<li><a href="#סיכום-פונקציונליות">סיכום פונקציונליות</a></li>
<li><a href="#עמודי-מדיניות-ונגישות">עמודי מדיניות ונגישות</a></li>
</ol>
</div>

## דרישות מקדימות

<div dir="rtl" align="right">

<ul dir="rtl">
<li><bdi dir="ltr">Node.js</bdi> גרסה 18 ומעלה (<code dir="ltr">node -v</code>).</li>
<li>נדרשת גישה למסד נתונים <bdi dir="ltr">MongoDB</bdi>. שתי אפשרויות מומלצות:
  <ul dir="rtl">
    <li><strong>התקנה מקומית</strong>: הורידו מ-<a href="https://www.mongodb.com/try/download/community" dir="ltr">mongodb.com/try/download/community</a> לפי מערכת ההפעלה שלכם, התקינו והריצו את השירות (<code dir="ltr">mongod</code>). ברוב ההתקנות השירות עולה אוטומטית וממשיך לרוץ ברקע (ב-<bdi dir="ltr">macOS</bdi> דרך <bdi dir="ltr">Homebrew</bdi>: <code dir="ltr">brew install mongodb-community</code> ואז <code dir="ltr">brew services start mongodb/brew/mongodb-community</code>).</li>
    <li><bdi dir="ltr">MongoDB Atlas</bdi> (ענן, חינמי): אם אינכם רוצים להתקין מקומית, אפשר ליצור <bdi dir="ltr">cluster</bdi> חינמי ב-<a href="https://www.mongodb.com/atlas" dir="ltr">mongodb.com/atlas</a> ולהשתמש בכתובת החיבור (<bdi dir="ltr">connection string</bdi>) שהוא נותן, במקום הכתובת המקומית.</li>
  </ul>
</li>
<li>מפתח <bdi dir="ltr">API</bdi> חינמי מ-<a href="https://openweathermap.org/api" dir="ltr">OpenWeatherMap</a> (לא חובה כדי שהאתר יעבוד - בלי מפתח פשוט יוצג "מזג האוויר אינו זמין"). ההרשמה חינמית וללא צורך בכרטיס אשראי. שימו לב: מפתח חדש עלול לקחת עד שעה-שעתיים "להתעורר" אצל <bdi dir="ltr">OpenWeatherMap</bdi> לפני שהוא מתחיל לעבוד בפועל.</li>
</ul>

</div>

## התקנה והרצה

```bash
# 1. התקנת חבילות
npm install

# 2. יצירת קובץ קונפיגורציה מקומי
cp .env.example .env
# פתחו את .env ועדכנו SESSION_SECRET ואת MONGODB_URI אם משתמשים בכתובת אחרת
# WEATHER_API_KEY הוא אופציונלי; WEATHER_CITY ו-WEATHER_CITY_HE משנים את העיר

# 3. ודאו ש-MongoDB רץ (mongod / Atlas)

# 4. הזנת 500 כתבות ונתוני הדגמה (הפקודה מוחקת קודם נתונים קיימים; ראו אזהרה למטה)
npm run seed

# 5. הרצת השרת
npm start
# האתר זמין בכתובת http://localhost:3000
```

<div dir="rtl" align="right">
<p><strong>שימו לב:</strong> <code dir="ltr">npm run seed</code> מוחק את כל המשתמשים, הכתבות, התגובות, נתוני הצפיות ואירועי הפרסום הקיימים במסד הנתונים שמוגדר ב-<code dir="ltr">MONGODB_URI</code>, ואז יוצר מחדש 500 כתבות ונתוני הדגמה. הריצו אותו רק על מסד נתונים המיועד לפיתוח/הדגמה.</p>
</div>

<div dir="rtl" align="right">
<p>לפיתוח שוטף אפשר <code dir="ltr">npm run dev</code> (מפעיל מחדש את השרת אוטומטית בכל שינוי, בעזרת
<code dir="ltr">node --watch</code>).</p>

<p><strong>טעינת שינויים:</strong> שינויים בקובצי <code dir="ltr">views/*.ejs</code>, <code dir="ltr">public/css/style.css</code>
ו-<code dir="ltr">public/js/*.js</code> לא דורשים הפעלה מחדש של השרת; רעננו את הדפדפן, ובמידת הצורך בצעו
רענון קשיח (<bdi dir="ltr">Cmd/Ctrl+Shift+R</bdi>). כשמריצים <code dir="ltr">npm run dev</code>, שינוי בקוד השרת
(<code dir="ltr">server.js</code>, נתיבים, בקרים, מודלים או <bdi dir="ltr">middleware</bdi>) גורם להפעלה מחדש אוטומטית.
כשמריצים <code dir="ltr">npm start</code>, יש לעצור ולהפעיל את השרת מחדש לאחר שינוי בקוד השרת.
שינוי ב-<code dir="ltr">.env</code> דורש הפעלה מחדש בשתי צורות ההרצה.</p>
</div>

## משתמשי הדגמה

<div dir="rtl" align="right">
<p>לאחר <code dir="ltr">npm run seed</code> נוצרים המשתמשים הבאים (סיסמה לכולם: <code dir="ltr">password123</code>):</p>
</div>

<div dir="rtl" align="right">
<table dir="rtl" style="direction: rtl; unicode-bidi: isolate; text-align: right;">
<thead>
<tr><th dir="rtl" align="right"><bdi dir="rtl">תפקיד</bdi></th><th dir="rtl" style="text-align: right;">שם משתמש</th></tr>
</thead>
<tbody>
<tr><td dir="rtl" align="right"><bdi dir="rtl">כתב</bdi></td><td dir="ltr" align="left"><code>reporter1</code>–<code>reporter4</code></td></tr>
<tr><td dir="rtl" align="right"><bdi dir="rtl">עורך</bdi></td><td dir="ltr" align="left"><code>editor1</code></td></tr>
</tbody>
</table>

<p>עורך מחובר יכול גם ליצור/לערוך/למחוק חשבונות כתבים נוספים בעצמו דרך "ניהול
משתמשים" בתפריט הניווט (<code dir="ltr">/editor/users</code>), ללא צורך בהרצת <bdi dir="ltr">seed</bdi> מחדש.</p>
</div>

## מבנה הפרויקט

```
the-daily-web/
├── .env.example             # תבנית הגדרות מקומיות
├── .gitignore               # החרגת הגדרות, לוגים ותלויות מגיט
├── README.md                # מדריך הפרויקט
├── package-lock.json        # נעילת גרסאות התלויות
├── package.json             # פקודות npm ותלויות
├── server.js                # נקודת הכניסה - הרכבת כל חלקי ה-MVC
├── config/db.js             # חיבור ל-MongoDB
├── models/                  # Model - סכמות Mongoose
│   ├── User.js                # כתבים ועורכים (hash סיסמה באמצעות bcrypt)
│   ├── Article.js             # כתבה: content (בעבודה) + published (מה שהציבור רואה)
│   ├── Comment.js
│   ├── ViewStat.js            # צבירת צפיות לפי "דלי" של שעה (ראו הסבר למטה)
│   └── PublishEvent.js        # תיעוד כל פרסום/עדכון, לסימון על גרף האנליטיקס
├── controllers/              # Controller - הלוגיקה העסקית
│   ├── authController.js       # התחברות/התנתקות
│   ├── publicArticleController.js  # פיד ציבורי + עמוד כתבה (SSR)
│   ├── reporterController.js   # אזור הכתב (יצירה/עריכה/autosave/שליחה לאישור)
│   ├── editorController.js     # אזור העורך (אישור/החזרה/מחיקה/עריכה)
│   ├── userController.js       # ניהול חשבונות כתבים ע"י העורך (CRUD מלא)
│   ├── commentController.js    # תגובות: הוספה/רשימה (ציבורי) + עריכה/מחיקה (עורך)
│   ├── statsController.js      # Impact Analytics
│   └── weatherController.js    # proxy לשירות מזג אוויר חיצוני
├── routes/                   # נתיבים
│   ├── authRoutes.js          # התחברות והתנתקות
│   ├── articleRoutes.js       # דפים ו-API ציבוריים לכתבות ותגובות
│   ├── reporterRoutes.js      # אזור הכתב
│   ├── editorRoutes.js        # אזור העורך, משתמשים, תגובות וסטטיסטיקה
│   ├── weatherRoutes.js       # API מזג אוויר
│   └── legalRoutes.js         # עמודי המדיניות והנגישות
├── middleware/
│   ├── auth.js                 # requireLogin / requireRole - בדיקות הרשאה בצד השרת
│   ├── commentRateLimiter.js   # הגבלת 3 תגובות בדקה לכל צירוף מכשיר וכתובת IP
│   ├── deviceId.js             # עוגיית מזהה מכשיר אנונימי
│   ├── loginRateLimiter.js     # הגבלת ניסיונות התחברות כושלים
│   └── errorHandler.js         # טיפול מרכזי בשגיאות
├── views/                    # View - תבניות EJS
│   ├── index.ejs, article.ejs, login.ejs, error.ejs
│   ├── legal/ (privacy, terms, accessibility)
│   ├── reporter/ (dashboard, edit)
│   ├── editor/ (dashboard, review, stats, users)
│   └── partials/ (head, navbar, footer, weather-widget)
├── public/                   # קבצים סטטיים
│   ├── css/style.css           # עיצוב יחיד, רספונסיבי (Flexbox/Grid)
│   ├── img/favicon.svg         # סמל האתר
│   ├── img/placeholder.svg     # תמונת ברירת מחדל לכתבות
│   └── js/                     # קוד לקוח - feed, article, reporter, editor,
│                                  users, stats, weather-widget, common
├── scripts/seed.js           # יצירת נתוני ההדגמה
├── utils/                    # קבועים, לוגר, מחולל תוכן דמה בעברית
├── docs/security.md          # תיעוד מנגנוני האבטחה והמגבלות הידועות
└── logs/
    ├── .gitkeep               # שומר את תיקיית הלוגים בגיט
    └── app.log                # נוצר אוטומטית בזמן ריצה (מוחרג מגיט)
```

## סיכום פונקציונליות

<div dir="rtl" align="right">
<ul dir="rtl">
<li><strong>פיד חדשות</strong> (<code dir="ltr">/</code>) - גלילה אינסופית (<bdi dir="ltr">IntersectionObserver</bdi>), חיפוש, סינון
לפי קטגוריה ו/או "לא נצפה" (מבוסס <bdi dir="ltr">localStorage</bdi> בצד הלקוח), מיון לפי תאריך/
פופולריות. כל כרטיס מציג כותרת, תמונה, תקציר, קטגוריה, <strong>שם הכתב</strong> ותאריך.
הכל דרך <code dir="ltr">/api/articles</code> ללא רענון עמוד.</li>
<li><strong>עמוד כתבה</strong> (<code dir="ltr">/articles/:id</code>) - מרונדר בשרת (<bdi dir="ltr">EJS</bdi>) כך שהתוכן המלא מופיע
ב-<bdi dir="ltr">HTML</bdi> הראשוני (<bdi dir="ltr">SEO</bdi>), עם תגובות (הוספה ללא רענון, עד 3 בדקה לכל צירוף מכשיר וכתובת <bdi dir="ltr">IP</bdi>). עורך מחובר
רואה גם כפתורי עריכה/מחיקה על כל תגובה (מודרציה).</li>
<li><strong>התחברות</strong> (<code dir="ltr">/login</code>) - כתבים/עורכים בלבד, <bdi dir="ltr">session</bdi> מבוסס <bdi dir="ltr">MongoDB</bdi>
(<bdi dir="ltr">connect-mongo</bdi>) כדי ש-<bdi dir="ltr">restart</bdi> של השרת לא ינתק משתמשים מחוברים.</li>
<li><strong>אזור הכתב</strong> (<code dir="ltr">/reporter</code>) - יצירה/עריכה עם שמירה אוטומטית (<bdi dir="ltr">autosave</bdi>),
שליחה לאישור, עריכת כתבה שהוחזרה או שכבר פורסמה.</li>
<li><strong>אזור העורך</strong> (<code dir="ltr">/editor</code>) - סינון לפי מצב עם עימוד, עריכה (רק לכתבה
שממתינה לאישור), אישור ופרסום, החזרה עם הערה, מחיקה. דף הבדיקה מציג גם את
הגוף המפורסם הנוכחי לצד התוכן החדש, להשוואה. כל מעברי המצב נאכפים בצד
השרת (<code dir="ltr">utils/constants.js</code> → <code dir="ltr">ALLOWED_TRANSITIONS</code>).</li>
<li><strong>ניהול משתמשים</strong> (<code dir="ltr">/editor/users</code>) - יצירה, עריכת שם תצוגה/סיסמה, ומחיקה
של חשבונות כתבים (חסום אם לכתב יש כתבות משויכות, כדי לא ליצור רשומות יתומות).</li>
<li><bdi dir="ltr">Impact Analytics</bdi> (<code dir="ltr">/editor/stats</code>) - גרף <bdi dir="ltr">Chart.js</bdi> של צפיות לאורך זמן עם
סימון נקודות פרסום/עדכון.</li>
<li><strong>ווידג'ט מזג אוויר</strong> - בסיידבר, דרך <bdi dir="ltr">proxy</bdi> בצד השרת ל-<bdi dir="ltr">OpenWeatherMap</bdi>, עם
מטמון של 15 דקות. שם העיר מוצג בעברית (<code dir="ltr">WEATHER_CITY_HE</code>) בנפרד מהשאילתה
שנשלחת בפועל ל-<bdi dir="ltr">API</bdi> (שחייבת להיות באנגלית).</li>
<li><strong>תמונות הדגמה מותאמות לקטגוריה</strong> - נתוני ה-seed מייצרים כתובות תמונה של
<bdi dir="ltr">LoremFlickr</bdi> עם מילות חיפוש לפי הקטגוריה; ההתאמה בפועל תלויה בתוצאות השירות החיצוני,
והתמונות דורשות חיבור לרשת. כתבות חדשות משתמשות בתמונת ברירת המחדל המקומית
<code dir="ltr">/img/placeholder.svg</code> (ראו <code dir="ltr">scripts/seed.js</code> ו-<code dir="ltr">models/Article.js</code>).</li>
<li><strong>אבטחה</strong> - סיסמאות נשמרות כ-hash חד-כיווני (<bdi dir="ltr">bcrypt</bdi>), בדיקות ההרשאה נעשות
בצד השרת, ועוגיית ה-session מוגדרת <bdi dir="ltr">SameSite=Lax</bdi> כהפחתת סיכון בסיסית (ללא טוקן
<bdi dir="ltr">CSRF</bdi>). קלטים עוברים בדיקות ומגבלות אורך, וטקסט משתמש נברח בעת הצגתו;
תווים מיוחדים ב-<bdi dir="ltr">regex</bdi> של החיפוש עוברים escaping, וניסיונות התחברות כושלים מוגבלים
לחמישה בדקה לכל כתובת <bdi dir="ltr">IP</bdi>.</li>
</ul>
</div>

## עמודי מדיניות ונגישות

<div dir="rtl" align="right">
<p>בפוטר האתר קיימים שלושה עמודים סטטיים (<code dir="ltr">routes/legalRoutes.js</code>,
<code dir="ltr">views/legal/</code>): <strong>מדיניות פרטיות</strong> (<code dir="ltr">/privacy</code>), <strong>תקנון האתר</strong> (<code dir="ltr">/terms</code>)
ו<strong>הצהרת נגישות</strong> (<code dir="ltr">/accessibility</code>) - המפרטת בכנות את התאמות הנגישות שיושמו
בפועל (<bdi dir="ltr">HTML</bdi> סמנטי, <bdi dir="ltr">RTL</bdi>, תוויות טפסים, ניווט מקלדת) לצד מגבלות ידועות, בלי
הצהרת תאימות מלאה שאינה נכונה.</p>
</div>