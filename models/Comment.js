// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    authorName: { type: String, required: true, trim: true, maxlength: 60 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    // deviceId משמש לאכיפת הגבלת הספאם (3 תגובות בדקה מאותו מכשיר) בצד השרת
    deviceId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
