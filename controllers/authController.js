// controllers/authController.js
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');
const { recordFailedLogin, clearFailedLogins } = require('../middleware/loginRateLimiter');

function renderLogin(req, res) {
  res.render('login', {
    title: 'התחברות',
    error: null,
    nextUrl: req.query.next || '',
  });
}

const login = asyncHandler(async (req, res) => {
  const { username, password, next: nextUrl } = req.body;

  if (!username || !password) {
    return res.status(400).render('login', {
      title: 'התחברות',
      error: 'יש למלא שם משתמש וסיסמה',
      nextUrl: nextUrl || '',
    });
  }

  const user = await User.findOne({ username: username.trim().toLowerCase() });
  const passwordOk = user ? await user.comparePassword(password) : false;

  if (!user || !passwordOk) {
    logger.warn('ניסיון התחברות כושל', { username });
    recordFailedLogin(req);
    return res.status(401).render('login', {
      title: 'התחברות',
      error: 'שם משתמש או סיסמה שגויים',
      nextUrl: nextUrl || '',
    });
  }

  // רק המידע הדרוש נשמר ב-session - לא ה-hash של הסיסמה
  clearFailedLogins(req);
  req.session.user = {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };

  logger.info('התחברות מוצלחת', { username: user.username, role: user.role });

  const safeNext = nextUrl && nextUrl.startsWith('/') ? nextUrl : null;
  if (safeNext) return res.redirect(safeNext);
  if (user.role === ROLES.EDITOR) return res.redirect('/editor');
  return res.redirect('/reporter');
});

const logout = asyncHandler(async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = { renderLogin, login, logout };
