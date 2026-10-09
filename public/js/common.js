// public/js/common.js - קוד משותף לכל הדפים (Vanilla JS בלבד, ללא ספריות חיצוניות)
(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // תאריך אמיתי של היום במסך העליון (masthead), כמו בעיתון מודפס
  var dateEl = document.getElementById('mastheadDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // מצב כהה/בהיר - האפליקציה עצמה (בניגוד לתצוגה המקדימה בצ'אט) רצה בדפדפן
  // הרגיל של המשתמש, כך שאפשר להשתמש ב-localStorage לזכירת ההעדפה בבטחה.
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('dailyweb_theme', next);
      } catch (e) {
        /* localStorage לא זמין - ההעדפה פשוט לא תישמר בין ביקורים */
      }
    });
  }
})();

// גיבוי לתמונות כתבות שנכשלו בטעינה. התמונות של נתוני הדמו מגיעות משירות חיצוני
// (LoremFlickr), ושירות כזה יכול להיות איטי, חסום ברשת או למטה. במקום אייקון
// "תמונה שבורה" מנסים תחילה מקור חלופי (picsum.photos, לפי אותו מזהה), ואם גם
// הוא נכשל - תמונת ה-placeholder המקומית שנמצאת בפרויקט עצמו ולכן תמיד זמינה.
// האירוע error לא "בועט" למעלה בעץ ה-DOM, לכן מאזינים בשלב ה-capture (true) -
// כך זה עובד גם על כרטיסים שנוספים דינמית בגלילה האינסופית.
function imageFallback(img) {
  if (!img.classList.contains('feed-card-image') && !img.classList.contains('article-image')) return;
  var step = parseInt(img.getAttribute('data-fallback-step') || '0', 10);
  img.setAttribute('data-fallback-step', String(step + 1));
  if (step === 0) {
    var seed = 0;
    var src = img.getAttribute('src') || '';
    for (var i = 0; i < src.length; i += 1) seed = (seed * 31 + src.charCodeAt(i)) >>> 0;
    img.src = 'https://picsum.photos/seed/dw' + (seed % 10000) + '/800/450';
  } else if (step === 1) {
    img.src = '/img/placeholder.svg';
  }
}

document.addEventListener(
  'error',
  function (e) {
    if (e.target && e.target.tagName === 'IMG') imageFallback(e.target);
  },
  true
);

// תמונה שכבר נכשלה לפני שהסקריפט הזה נטען (למשל תמונת הכתבה שמרונדרת בשרת)
document.querySelectorAll('img.article-image').forEach(function (img) {
  if (img.complete && img.naturalWidth === 0) imageFallback(img);
});

// עזר קטן לכל שאר קבצי ה-JS: fetch עם JSON, וזריקת שגיאה קריאה אם הבקשה נכשלה
async function apiRequest(url, options) {
  var response = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options));
  var data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  if (!response.ok) {
    var message = (data && data.message) || 'אירעה שגיאה, נסו שוב';
    throw new Error(message);
  }
  return data;
}
