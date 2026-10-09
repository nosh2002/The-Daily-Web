// public/js/weather-widget.js
(function () {
  var content = document.getElementById('weatherContent');
  if (!content) return;

  apiRequest('/api/weather')
    .then(function (data) {
      if (!data.available) {
        content.innerHTML =
          '<p class="weather-unavailable">מזג האוויר אינו זמין כרגע' +
          (data.reason === 'no-api-key' ? ' (לא הוגדר מפתח API)' : '') +
          '.</p>';
        return;
      }
      var iconUrl = data.icon ? 'https://openweathermap.org/img/wn/' + data.icon + '@2x.png' : '';
      content.innerHTML =
        '<div class="weather-main">' +
        (iconUrl ? '<img src="' + iconUrl + '" alt="" class="weather-icon" />' : '') +
        '<span class="weather-temp">' + data.tempC + '°C</span>' +
        '</div>' +
        '<p class="weather-desc">' + data.description + '</p>' +
        '<p class="weather-city">' + data.city + '</p>' +
        (data.stale ? '<p class="weather-stale">נתונים מעט מיושנים</p>' : '');
    })
    .catch(function () {
      content.innerHTML = '<p class="weather-unavailable">מזג האוויר אינו זמין כרגע.</p>';
    });
})();
