// Google Auth
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

const GOOGLE_CLIENT_ID = "our-google-client-id";
const GOOGLE_CLIENT_SECRET = "our-google-client-secret";

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/callback",
//     },
//     function (accessToken, refreshToken, profile, done) {
//       userProfile = profile;
//       return done(null, userProfile);
//     }
//   )
// );
