// public/js/editor.js - עמוד בדיקת כתבה בצד העורך
(function () {
  var page = document.querySelector('.page-review');
  if (!page) return;

  var articleId = page.getAttribute('data-article-id');
  var formMessage = document.getElementById('formMessage');
  var saveBtn = document.getElementById('saveBtn');
  var approveBtn = document.getElementById('approveBtn');
  var deleteBtn = document.getElementById('deleteBtn');
  var returnBtn = document.getElementById('returnBtn');
  var returnNote = document.getElementById('returnNote');

  function currentValues() {
    return {
      title: document.getElementById('title').value,
      summary: document.getElementById('summary').value,
      category: document.getElementById('category').value,
      imageUrl: document.getElementById('imageUrl').value,
      body: document.getElementById('body').value,
    };
  }

  saveBtn.addEventListener('click', async function () {
    try {
      await apiRequest('/editor/api/articles/' + articleId, {
        method: 'PATCH',
        body: JSON.stringify(currentValues()),
      });
      formMessage.textContent = 'השינויים נשמרו.';
    } catch (err) {
      formMessage.textContent = 'שגיאה: ' + err.message;
    }
  });

  approveBtn.addEventListener('click', async function () {
    try {
      await apiRequest('/editor/api/articles/' + articleId, {
        method: 'PATCH',
        body: JSON.stringify(currentValues()),
      });
      await apiRequest('/editor/api/articles/' + articleId + '/approve', { method: 'POST' });
      window.location.href = '/editor';
    } catch (err) {
      formMessage.textContent = 'שגיאה באישור: ' + err.message;
    }
  });

  returnBtn.addEventListener('click', async function () {
    if (!returnNote.value.trim()) {
      formMessage.textContent = 'יש לכתוב הערה להחזרת הכתבה.';
      return;
    }
    try {
      await apiRequest('/editor/api/articles/' + articleId + '/return', {
        method: 'POST',
        body: JSON.stringify({ note: returnNote.value }),
      });
      window.location.href = '/editor';
    } catch (err) {
      formMessage.textContent = 'שגיאה בהחזרת הכתבה: ' + err.message;
    }
  });

  deleteBtn.addEventListener('click', async function () {
    if (!window.confirm('למחוק את הכתבה לצמיתות? לא ניתן לשחזר פעולה זו.')) return;
    try {
      await apiRequest('/editor/api/articles/' + articleId, { method: 'DELETE' });
      window.location.href = '/editor';
    } catch (err) {
      formMessage.textContent = 'שגיאה במחיקה: ' + err.message;
    }
  });
})();
