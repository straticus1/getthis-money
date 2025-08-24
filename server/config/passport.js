const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findByOAuth('google', profile.id);

    if (user) {
      // Update profile information
      user.oauthProfile = profile._json;
      user.avatar = profile.photos[0]?.value || user.avatar;
      await user.save();
      return done(null, user);
    }

    // Check if email is already registered
    const email = profile.emails[0]?.value;
    if (email) {
      user = await User.findByEmail(email);
      if (user) {
        // Link OAuth to existing account
        user.oauthProvider = 'google';
        user.oauthId = profile.id;
        user.oauthProfile = profile._json;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.isEmailVerified = true; // OAuth emails are verified
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    user = new User({
      email: email,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      oauthProvider: 'google',
      oauthId: profile.id,
      oauthProfile: profile._json,
      avatar: profile.photos[0]?.value,
      isEmailVerified: true,
      username: profile.username || null
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/api/auth/github/callback",
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findByOAuth('github', profile.id);

    if (user) {
      // Update profile information
      user.oauthProfile = profile._json;
      user.avatar = profile.photos[0]?.value || user.avatar;
      await user.save();
      return done(null, user);
    }

    // Check if email is already registered
    const email = profile.emails[0]?.value;
    if (email) {
      user = await User.findByEmail(email);
      if (user) {
        // Link OAuth to existing account
        user.oauthProvider = 'github';
        user.oauthId = profile.id;
        user.oauthProfile = profile._json;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.isEmailVerified = true;
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    user = new User({
      email: email,
      firstName: profile.displayName?.split(' ')[0] || '',
      lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
      oauthProvider: 'github',
      oauthId: profile.id,
      oauthProfile: profile._json,
      avatar: profile.photos[0]?.value,
      isEmailVerified: true,
      username: profile.username
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "/api/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findByOAuth('facebook', profile.id);

    if (user) {
      // Update profile information
      user.oauthProfile = profile._json;
      user.avatar = profile.photos[0]?.value || user.avatar;
      await user.save();
      return done(null, user);
    }

    // Check if email is already registered
    const email = profile.emails[0]?.value;
    if (email) {
      user = await User.findByEmail(email);
      if (user) {
        // Link OAuth to existing account
        user.oauthProvider = 'facebook';
        user.oauthId = profile.id;
        user.oauthProfile = profile._json;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.isEmailVerified = true;
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    user = new User({
      email: email,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      oauthProvider: 'facebook',
      oauthId: profile.id,
      oauthProfile: profile._json,
      avatar: profile.photos[0]?.value,
      isEmailVerified: true
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

module.exports = passport;
