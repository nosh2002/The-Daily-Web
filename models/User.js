// models/User.js
// משתמשים מסוג כתב/עורך בלבד. "אורח" אינו נשמר במסד הנתונים - הוא כל מבקר שאינו מחובר.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [ROLES.REPORTER, ROLES.EDITOR],
      required: true,
    },
  },
  { timestamps: true }
);

// שיטת מופע: בדיקת סיסמה מול ה-hash השמור.
// חשוב: אף פעם לא שומרים את הסיסמה עצמה - רק hash חד-כיווני (bcrypt), ולכן
// אי אפשר "לשחזר" ממנו את הסיסמה המקורית, כנדרש במסמך הדרישות.
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// פונקציית עזר סטטית ליצירת משתמש עם הצפנת סיסמה אוטומטית
userSchema.statics.createWithPassword = async function createWithPassword({
  username,
  displayName,
  password,
  role,
}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return this.create({ username, displayName, passwordHash, role });
};

// לעולם לא לשלוח את ה-hash ללקוח, גם אם מישהו בטעות ינסה res.json(user)
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
