// public/js/stats.js - גרף Impact Analytics באמצעות Chart.js
(function () {
  var select = document.getElementById('articleSelect');
  var canvas = document.getElementById('viewsChart');
  var messageEl = document.getElementById('statsMessage');
  var chart = null;

  // Plugin מותאם אישית ל-Chart.js: מצייר קו אנכי בכל נקודת זמן שבה עורך אישר
  // פרסום/עדכון, כדי שאפשר יהיה לראות בעין כיצד השתנתה כמות הצפיות סביב הפרסום.
  var publishMarkersPlugin = {
    id: 'publishMarkers',
    afterDraw: function (chartInstance) {
      var markers = chartInstance.config._publishMarkers || [];
      if (!markers.length) return;
      var xScale = chartInstance.scales.x;
      var yScale = chartInstance.scales.y;
      var ctx = chartInstance.ctx;

      markers.forEach(function (marker) {
        var x = xScale.getPixelForValue(new Date(marker.t).getTime());
        if (x < xScale.left || x > xScale.right) return;
        ctx.save();
        ctx.strokeStyle = '#d64545';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, yScale.top);
        ctx.lineTo(x, yScale.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#d64545';
        ctx.font = '11px sans-serif';
        ctx.fillText('פרסום v' + marker.version, x + 4, yScale.top + 12);
        ctx.restore();
      });
    },
  };

  async function loadStats(articleId) {
    if (!articleId) return;
    messageEl.textContent = 'טוען נתונים…';
    try {
      var data = await apiRequest('/editor/api/stats/articles/' + articleId);
      messageEl.textContent = 'סה"כ צפיות: ' + data.totalViews;

      var points = data.series.map(function (p) {
        return { x: new Date(p.t).getTime(), y: p.count };
      });

      if (chart) chart.destroy();
      chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'צפיות לשעה',
              data: points,
              borderColor: '#2b6cb0',
              backgroundColor: 'rgba(43,108,176,0.15)',
              tension: 0.25,
              fill: true,
              pointRadius: 2,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'linear',
              ticks: {
                callback: function (value) {
                  return new Date(value).toLocaleString('he-IL', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                },
              },
              title: { display: true, text: 'זמן' },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: 'כמות צפיות' },
            },
          },
        },
        plugins: [publishMarkersPlugin],
      });
      chart.config._publishMarkers = data.publishEvents;
      chart.update();
    } catch (err) {
      messageEl.textContent = 'שגיאה בטעינת הנתונים: ' + err.message;
    }
  }

  select.addEventListener('change', function () {
    if (select.value) {
      window.history.replaceState(null, '', '/editor/stats/' + select.value);
      loadStats(select.value);
    }
  });

  if (window.__INITIAL_ARTICLE_ID__) {
    loadStats(window.__INITIAL_ARTICLE_ID__);
  }
})();
