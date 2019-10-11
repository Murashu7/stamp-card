var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');

var app = express();
app.use(helmet());

var session = require('express-session');
var passport = require('passport');

var User = require('./models/user');
var Objective = require('./models/objective');
var Month = require('./models/month');
var Stamp = require('./models/stamp');

User.sync().then(() => {
  Objective.belongsTo(User, {foreignKey: 'createdBy'});
  Objective.sync().then(() => {
    Month.belongsTo(Objective, {foreignKey: 'objectiveId'});
    Month.sync().then(() => {
      Stamp.belongsTo(Objective, {foreignKey: 'objectiveId'});
      Stamp.belongsTo(Month, {foreignKey: 'monthId'});
      Stamp.sync();
    });
  });
});

var GitHubStrategy = require('passport-github2').Strategy;
// var GITHUB_CLIENT_ID = '7511dc825f840c2ce36a';
// var GITHUB_CLIENT_SECRET = 'dc0241cc011d44509e46d2431ace69009c8264dd';

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '369945f2583986dd5c25';
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '587ed022a206b84759e8a79ce7cb035df0447bb3';

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: process.env.HEROKU_URL ? process.env.HEROKU_URL + 'auth/github/callback' : 'http://localhost:8000/auth/github/callback'
},
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.upsert({
        userId: profile.id,
        username: profile.username
      }).then(() => {
        done(null, profile);
      });
    });
  }
));

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var objectiveRouter = require('./routes/objectives');
var stampRouter = require('./routes/stamps');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: '8d1daafe604b1e25', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/objectives', objectiveRouter);
app.use('/objectives', stampRouter);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
});

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    var loginFrom = req.cookies.loginFrom;
    // オープンリダイレクト脆弱性対策
    if (loginFrom &&
      !loginFrom.includes('http://') &&
      !loginFrom.includes('https://')) {
      res.clearCookie('loginFrom');
      res.redirect(loginFrom);
    } else {
      res.redirect('/');
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// public フォルダを利用する
app.use(express.static('public'));

module.exports = app;
