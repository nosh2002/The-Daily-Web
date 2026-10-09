// models/PublishEvent.js
// כל אישור פרסום (ראשוני או עדכון) נרשם כאן. משמש לסימון נקודות ציון על גרף
// ה-Impact Analytics, כדי לראות כיצד השתנתה כמות הצפיות לפני/אחרי כל עדכון.

const mongoose = require('mongoose');

const publishEventSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
  publishedAt: { type: Date, required: true, default: Date.now },
  // גרסה ראשונה (1) או עדכון (2, 3, ...)
  version: { type: Number, required: true },
  editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('PublishEvent', publishEventSchema);
