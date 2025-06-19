import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { sequelize } from './database.js';
import User from '../models/User.js';

// Cấu hình Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Kiểm tra xem người dùng đã tồn tại chưa
    let user = await User.findOne({ where: { email: profile.emails[0].value } });

    if (!user) {
      // Tạo người dùng mới nếu chưa tồn tại
      user = await User.create({
        email: profile.emails[0].value,
        username: profile.emails[0].value.split('@')[0],
        full_name: profile.displayName,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        status: 'active'
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Cấu hình Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Tìm người dùng theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      return done(null, false, { message: 'Account is not active' });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 