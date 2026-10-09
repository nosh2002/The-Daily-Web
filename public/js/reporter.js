// public/js/reporter.js
// עריכת כתבה בצד הכתב: שמירה אוטומטית (autosave) בזמן הקלדה, ללא כפתור "שמור"
// ייעודי - עונה על דרישת "המשכיות עבודה" (סגירת דפדפן/רענון לא יגרמו לאובדן מידע).

(function () {
  var page = document.querySelector('.page-edit');
  if (!page) return;

  var articleId = page.getAttribute('data-article-id');
  var editable = page.getAttribute('data-editable') === 'true';
  var form = document.getElementById('editForm');
  var saveStatus = document.getElementById('lastSavedAt');
  var formMessage = document.getElementById('formMessage');
  var submitBtn = document.getElementById('submitBtn');

  var saveTimer = null;
  var SAVE_DEBOUNCE_MS = 1200;

  function currentValues() {
    return {
      title: document.getElementById('title').value,
      summary: document.getElementById('summary').value,
      category: document.getElementById('category').value,
      imageUrl: document.getElementById('imageUrl').value,
      body: document.getElementById('body').value,
    };
  }

  async function autosave() {
    try {
      var data = await apiRequest('/reporter/api/articles/' + articleId, {
        method: 'PATCH',
        body: JSON.stringify(currentValues()),
      });
      saveStatus.textContent = new Date(data.lastSavedAt).toLocaleTimeString('he-IL');
      formMessage.textContent = '';
    } catch (err) {
      formMessage.textContent = 'שגיאה בשמירה אוטומטית: ' + err.message;
    }
  }

  if (editable) {
    form.addEventListener('input', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(autosave, SAVE_DEBOUNCE_MS);
    });

    // שמירה מיידית גם כאשר המשתמש עוזב את שדה הקלט (למשל עובר לשדה אחר או
    // סוגר את החלון), כדי לצמצם עוד יותר את הסיכוי לאובדן תווים אחרונים
    form.addEventListener(
      'blur',
      function () {
        clearTimeout(saveTimer);
        autosave();
      },
      true
    );
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async function () {
      clearTimeout(saveTimer);
      try {
        await autosave();
        await apiRequest('/reporter/api/articles/' + articleId + '/submit', { method: 'POST' });
        window.location.href = '/reporter';
      } catch (err) {
        formMessage.textContent = 'שגיאה בשליחה לאישור: ' + err.message;
      }
    });
  }
})();
