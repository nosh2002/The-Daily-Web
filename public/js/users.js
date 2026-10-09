// public/js/users.js - ניהול חשבונות כתבים (עמוד /editor/users)
(function () {
  var form = document.getElementById('createUserForm');
  var table = document.getElementById('usersTable');
  if (!form || !table) return;

  var createMessage = document.getElementById('createUserMessage');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    createMessage.textContent = '';

    var username = document.getElementById('newUsername').value;
    var displayName = document.getElementById('newDisplayName').value;
    var password = document.getElementById('newPassword').value;

    try {
      await apiRequest('/editor/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: username, displayName: displayName, password: password }),
      });
      // הדרך הפשוטה והבטוחה ביותר לרענן את הטבלה עם השורה החדשה
      window.location.reload();
    } catch (err) {
      createMessage.textContent = 'שגיאה: ' + err.message;
    }
  });

  table.addEventListener('click', async function (e) {
    var row = e.target.closest('tr[data-user-id]');
    if (!row) return;
    var userId = row.getAttribute('data-user-id');

    if (e.target.classList.contains('user-delete-btn')) {
      if (!confirm('למחוק את חשבון הכתב הזה לצמיתות?')) return;
      try {
        await apiRequest('/editor/api/users/' + userId, { method: 'DELETE' });
        row.remove();
      } catch (err) {
        alert('שגיאה במחיקה: ' + err.message);
      }
      return;
    }

    if (e.target.classList.contains('user-edit-btn')) {
      var nameCell = row.querySelector('.user-display-name');
      var newName = prompt('שם תצוגה חדש:', nameCell.textContent);
      if (newName === null || !newName.trim()) return;

      var newPassword = prompt('סיסמה חדשה (השאירו ריק כדי לא לשנות סיסמה):', '');
      var payload = { displayName: newName };
      if (newPassword && newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          alert('הסיסמה חייבת להכיל לפחות 6 תווים - לא בוצע שינוי.');
          return;
        }
        payload.password = newPassword.trim();
      }

      try {
        await apiRequest('/editor/api/users/' + userId, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        nameCell.textContent = newName.trim();
      } catch (err) {
        alert('שגיאה בעדכון: ' + err.message);
      }
    }
  });
})();
