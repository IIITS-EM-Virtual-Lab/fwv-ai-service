// app.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authController = require('./controllers/Auth');
const { auth } = require('./middleware/auth');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quiz');
const quizResultRoutes = require('./routes/quizResultRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const feedbackRoutes = require("./routes/feedbackRoutes");
const chatRoutes = require('./routes/chatRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Mongo Error:', err));

// ✅ AUTH ROUTES (Updated - No OTP)
app.post('/api/auth/signup', authController.signup);           // NEW: Direct signup
app.post('/api/auth/login', authController.login);              // Login
app.get('/api/auth/me', auth, authController.getCurrentUser);   // Get current user
app.get('/api/auth/google', authController.getGoogleAuthURL);   // Google OAuth URL
app.get('/api/auth/google/callback', authController.handleGoogleCallback); // Google callback

// Other Routes
app.use('/api/password-reset', passwordResetRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quizresult', quizResultRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
