// public/js/article.js - עמוד כתבה: סימון "נצפה" + טופס תגובות ללא רענון עמוד
(function () {
  var SEEN_KEY = 'dailyweb_seen_articles';
  var articleEl = document.querySelector('.article-full');
  if (articleEl) {
    var id = articleEl.getAttribute('data-article-id');
    try {
      var seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      if (seen.indexOf(id) === -1) {
        seen.push(id);
        // אותה הגבלה כמו ב-feed.js - הרשימה נשלחת כ-query string, אז היא לא
        // יכולה לגדול בלי הגבלה גם כשנכנסים ישירות לכתבות (לא רק דרך הפיד)
        if (seen.length > 300) seen = seen.slice(seen.length - 300);
        localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
      }
    } catch (e) {
      /* localStorage לא זמין - לא קריטי */
    }
  }

  var form = document.getElementById('commentForm');
  var list = document.getElementById('commentList');
  var countEl = document.getElementById('commentCount');
  var messageEl = document.getElementById('commentFormMessage');

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  var isEditor = window.__CURRENT_USER_ROLE__ === 'editor';

  function commentHtml(c) {
    var date = new Date(c.createdAt).toLocaleString('he-IL');
    return (
      '<li class="comment-item" data-comment-id="' + c.id + '">' +
      '<p class="comment-header"><strong>' + escapeHtml(c.authorName) + '</strong> <time>' + date + '</time></p>' +
      '<p class="comment-text">' + escapeHtml(c.text) + '</p>' +
      (isEditor
        ? '<div class="comment-mod-actions">' +
          '<button type="button" class="link-button comment-edit-btn">עריכה</button>' +
          '<button type="button" class="link-button comment-delete-btn">מחיקה</button></div>'
        : '') +
      '</li>'
    );
  }

  // מודרציית תגובות ע"י עורך (הכפתורים מוצגים רק לעורך מחובר בצד הלקוח, אבל
  // ה-API עצמו מוגן ב-requireEditor בצד השרת - הסתרת כפתור אינה מימוש הרשאות)
  if (list) {
    list.addEventListener('click', async function (e) {
      var item = e.target.closest('.comment-item');
      if (!item) return;
      var commentId = item.getAttribute('data-comment-id');

      if (e.target.classList.contains('comment-delete-btn')) {
        if (!confirm('למחוק את התגובה?')) return;
        try {
          await apiRequest('/editor/api/comments/' + commentId, { method: 'DELETE' });
          item.remove();
          countEl.textContent = String(parseInt(countEl.textContent, 10) - 1);
        } catch (err) {
          alert('שגיאה במחיקת התגובה: ' + err.message);
        }
        return;
      }

      if (e.target.classList.contains('comment-edit-btn')) {
        var textEl = item.querySelector('.comment-text');
        var newText = prompt('עריכת תגובה:', textEl.textContent);
        if (newText === null || !newText.trim()) return;
        try {
          var data = await apiRequest('/editor/api/comments/' + commentId, {
            method: 'PATCH',
            body: JSON.stringify({ text: newText }),
          });
          textEl.textContent = data.comment.text;
        } catch (err) {
          alert('שגיאה בעדכון התגובה: ' + err.message);
        }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      messageEl.textContent = '';
      var articleId = articleEl.getAttribute('data-article-id');
      var authorName = document.getElementById('commentAuthor').value;
      var text = document.getElementById('commentText').value;

      try {
        var data = await apiRequest('/api/articles/' + articleId + '/comments', {
          method: 'POST',
          body: JSON.stringify({ authorName: authorName, text: text }),
        });
        // התגובה מופיעה מיד ברשימה, ללא טעינה מחדש של הרשימה כולה
        list.insertAdjacentHTML('beforeend', commentHtml(data.comment));
        countEl.textContent = String(parseInt(countEl.textContent, 10) + 1);
        form.reset();
      } catch (err) {
        messageEl.textContent = err.message;
      }
    });
  }
})();
