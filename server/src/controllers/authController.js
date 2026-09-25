const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Token generators
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

// Controller Actions
const register = async (req, res) => {
  try {
    const { name, email, password, studyGoals, dailyTargetHours } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = db.insert('users', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      studyGoals: studyGoals || 'Master my courses and maintain high test scores.',
      dailyTargetHours: parseFloat(dailyTargetHours) || 2,
      studyStreak: 1,
      lastLoginDate: new Date().toISOString()
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Store refresh token
    db.insert('refresh_tokens', {
      userId: newUser.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Set HTTP-only refresh cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // development mode
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userSansPassword = { ...newUser };
    delete userSansPassword.password;

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      accessToken,
      refreshToken,
      user: userSansPassword
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to a server error.',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update study streak
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLoginStr = user.lastLoginDate ? user.lastLoginDate.split('T')[0] : '';
    let updatedStreak = user.studyStreak || 1;

    if (lastLoginStr && lastLoginStr !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLoginStr === yesterdayStr) {
        updatedStreak += 1;
      } else {
        updatedStreak = 1;
      }
    }

    db.update('users', user.id, {
      studyStreak: updatedStreak,
      lastLoginDate: new Date().toISOString()
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    db.insert('refresh_tokens', {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userSansPassword = { ...user, studyStreak: updatedStreak };
    delete userSansPassword.password;

    return res.json({
      success: true,
      message: 'Login successful!',
      accessToken,
      refreshToken,
      user: userSansPassword
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed due to a server error.',
      error: error.message
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found.'
      });
    }

    const storedToken = db.findOne('refresh_tokens', t => t.token === token);
    if (!storedToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = db.findById('users', decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user);

      return res.json({
        success: true,
        accessToken: newAccessToken
      });
    } catch (err) {
      // Clean up invalid/expired refresh token
      db.deleteWhere('refresh_tokens', t => t.token === token);
      return res.status(403).json({
        success: false,
        message: 'Refresh token expired or invalid. Please log in again.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh session token.',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      db.deleteWhere('refresh_tokens', t => t.token === token);
    }
    res.clearCookie('refreshToken');
    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = db.findById('users', req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Gather statistics
    const docs = db.find('documents', d => d.userId === user.id);
    const quizzes = db.find('quizzes', q => q.userId === user.id);
    const flashcards = db.find('flashcards', f => f.userId === user.id);
    const studyPlans = db.find('study_plans', sp => sp.userId === user.id);

    let totalQuizzesTaken = 0;
    let totalQuizScoreSum = 0;
    quizzes.forEach(q => {
      if (q.scoreHistory && q.scoreHistory.length > 0) {
        totalQuizzesTaken += q.scoreHistory.length;
        const lastScore = q.scoreHistory[q.scoreHistory.length - 1];
        totalQuizScoreSum += lastScore.scorePercentage;
      }
    });

    const avgQuizScore = totalQuizzesTaken > 0 ? Math.round(totalQuizScoreSum / quizzes.length) : 0;

    let totalFlashcards = 0;
    let masteredFlashcards = 0;
    flashcards.forEach(fcSet => {
      if (fcSet.cards) {
        totalFlashcards += fcSet.cards.length;
        masteredFlashcards += fcSet.cards.filter(c => c.status === 'mastered').length;
      }
    });

    const userSansPassword = { ...user };
    delete userSansPassword.password;

    return res.json({
      success: true,
      user: userSansPassword,
      stats: {
        totalDocuments: docs.length,
        totalQuizzes: quizzes.length,
        quizzesTakenCount: totalQuizzesTaken,
        avgQuizScore,
        totalFlashcardSets: flashcards.length,
        totalFlashcards,
        masteredFlashcards,
        totalStudyPlans: studyPlans.length,
        studyStreak: user.studyStreak || 1
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, studyGoals, dailyTargetHours, currentPassword, newPassword } = req.body;
    const user = db.findById('users', req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (name) {
      updates.name = name;
      updates.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    }
    if (studyGoals !== undefined) updates.studyGoals = studyGoals;
    if (dailyTargetHours !== undefined) updates.dailyTargetHours = parseFloat(dailyTargetHours) || 2;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = db.update('users', user.id, updates);
    const userSansPassword = { ...updatedUser };
    delete userSansPassword.password;

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: userSansPassword
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile
};
