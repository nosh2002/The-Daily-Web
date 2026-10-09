// public/js/feed.js
// פיד החדשות בעמוד הבית: גלילה אינסופית + חיפוש/סינון/מיון, הכל ללא רענון מלא
// של העמוד (Ajax/fetch). מעקב אחר כתבות "שנצפו" מתבצע בצד הלקוח (localStorage)
// כי אלו אורחים לא מזוהים ואין להם חשבון משתמש בשרת.

(function () {
  var SEEN_KEY = 'dailyweb_seen_articles';
  var feedList = document.getElementById('feedList');
  var feedStatus = document.getElementById('feedStatus');
  var sentinel = document.getElementById('feedSentinel');
  var searchInput = document.getElementById('searchInput');
  var categorySelect = document.getElementById('categorySelect');
  var seenSelect = document.getElementById('seenSelect');
  var sortSelect = document.getElementById('sortSelect');

  var state = { page: 1, loading: false, hasMore: true };
  var searchDebounceTimer = null;

  function getSeenIds() {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function markSeen(id) {
    try {
      var seen = getSeenIds();
      if (seen.indexOf(id) === -1) {
        seen.push(id);
        // מגבילים את הגודל כדי שלא יתנפח ללא הגבלה
        // מגבילים ל-300 (ולא יותר) כי הרשימה הזו נשלחת כ-query string בבקשת הפילטר
      // "לא נצפו" - רשימה ארוכה מדי הייתה עלולה לחרוג ממגבלת אורך URL/headers
      if (seen.length > 300) seen = seen.slice(seen.length - 300);
        localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
      }
    } catch (e) {
      /* localStorage לא זמין - לא קריטי, ממשיכים בלי מעקב "נצפה" */
    }
  }

  function buildQuery() {
    var params = new URLSearchParams();
    params.set('page', state.page);
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (categorySelect.value) params.set('category', categorySelect.value);
    if (sortSelect.value) params.set('sort', sortSelect.value);
    if (seenSelect.value === 'notseen') {
      params.set('seen', 'notseen');
      var seenIds = getSeenIds();
      if (seenIds.length) params.set('seenIds', seenIds.join(','));
    }
    return params.toString();
  }

  function cardHtml(article) {
    var date = new Date(article.publishedAt).toLocaleDateString('he-IL');
    var isSeen = getSeenIds().indexOf(String(article.id)) !== -1;
    return (
      '<article class="feed-card' + (isSeen ? ' is-seen' : '') + '">' +
      '<a href="/articles/' + article.id + '" class="feed-card-link" data-article-id="' + article.id + '">' +
      '<img src="' + article.imageUrl + '" alt="" class="feed-card-image" loading="lazy" />' +
      '<div class="feed-card-body">' +
      '<p class="feed-card-category" data-cat="' + article.category + '">' + article.category + '</p>' +
      '<h2 class="feed-card-title">' + escapeHtml(article.title) + '</h2>' +
      '<p class="feed-card-summary">' + escapeHtml(article.summary) + '</p>' +
      '<p class="feed-card-meta">מאת <strong>' + escapeHtml(article.reporterName) + '</strong> · ' + date + ' · ' + article.viewCount + ' צפיות' + (isSeen ? ' · <span class="seen-tag">נצפה</span>' : '') + '</p>' +
      '</div></a></article>'
    );
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  async function loadPage(reset) {
    if (state.loading) return;
    if (!reset && !state.hasMore) return;

    state.loading = true;
    feedStatus.textContent = 'טוען כתבות…';

    try {
      var data = await apiRequest('/api/articles?' + buildQuery());
      if (reset) feedList.innerHTML = '';

      if (!data.articles.length && reset) {
        feedStatus.textContent = 'לא נמצאו כתבות התואמות את החיפוש.';
      } else {
        feedStatus.textContent = '';
      }

      data.articles.forEach(function (article) {
        feedList.insertAdjacentHTML('beforeend', cardHtml(article));
      });

      state.hasMore = data.hasMore;
      if (state.hasMore) state.page += 1;
    } catch (err) {
      feedStatus.textContent = 'שגיאה בטעינת הכתבות: ' + err.message;
    } finally {
      state.loading = false;
    }
  }

  function resetAndLoad() {
    state.page = 1;
    state.hasMore = true;
    loadPage(true);
  }

  searchInput.addEventListener('input', function () {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(resetAndLoad, 350);
  });
  categorySelect.addEventListener('change', resetAndLoad);
  seenSelect.addEventListener('change', resetAndLoad);
  sortSelect.addEventListener('change', resetAndLoad);

  // סימון "נצפה" כאשר לוחצים על כתבה (לפני הניווט לעמוד הכתבה)
  feedList.addEventListener('click', function (e) {
    var link = e.target.closest('.feed-card-link');
    if (link) markSeen(link.getAttribute('data-article-id'));
  });

  // גלילה אינסופית - IntersectionObserver על אלמנט "משמר" בתחתית הפיד
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) loadPage(false);
      });
    },
    { rootMargin: '400px' }
  );
  observer.observe(sentinel);

  loadPage(true);
})();
