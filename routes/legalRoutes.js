// routes/legalRoutes.js - עמודי מדיניות סטטיים, פתוחים לכולם
const express = require('express');
const router = express.Router();

// תאריך עדכון קבוע אחד לכל שלושת המסמכים - קל לעדכן במקום אחד
const LAST_UPDATED = '16 בספטמבר 2026';

router.get('/privacy', (req, res) => {
  res.render('legal/privacy', { title: 'מדיניות פרטיות', lastUpdated: LAST_UPDATED });
});

router.get('/terms', (req, res) => {
  res.render('legal/terms', { title: 'תקנון האתר', lastUpdated: LAST_UPDATED });
});

router.get('/accessibility', (req, res) => {
  res.render('legal/accessibility', { title: 'הצהרת נגישות', lastUpdated: LAST_UPDATED });
});

module.exports = router;
