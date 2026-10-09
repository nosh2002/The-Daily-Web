// routes/weatherRoutes.js - פתוח לכולם (הווידג'ט מוצג בסיידבר לכל מבקר)
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/api/weather', weatherController.getWeather);

module.exports = router;
