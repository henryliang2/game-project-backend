const express = require('express');
const fetch = require('node-fetch')
const cors = require('cors');
const app = express();
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User.js');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const PassportConfig = require('./PassportConfig');
const Dates = require('./Dates');
const RouteHandlers = require('./RouteHandlers');

// default variables
const PORT = process.env.PORT || 8080;
const ORIGIN_URL = ( 
  process.env.REACT_APP_ENVIRONMENT  === 'development'
    ? 'http://localhost:3000'
    : 'https://gameproject.netlify.app'
);
const rawgApiKey = process.env.REACT_APP_RAWG_API_KEY;
const rawgApiHeaders = { 
  'Content-Type': 'application/json',
  'User-Agent'  : 'Game-Project Personal Web Development Portfolio Project'
};

// Passport Configuration

passport.use(PassportConfig.googleStrategy);

passport.serializeUser((user, done) => {
  done(null, user.userId);
});

passport.deserializeUser((id, done) => {
  User.findOne({userId: id}, (err, user) => done(err, user));
});

// MongoDB + Mongoose

mongoose.connect(`mongodb+srv://zomgitshenry:${process.env.REACT_APP_MONGODB_KEY}@cluster0.gy4ko.mongodb.net/gameproject?retryWrites=true&w=majority`, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false 
  });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('MongoDB Connected');
});

// Middleware

app.use(cookieParser());
app.use(expressSession({ 
  resave: true,
  saveUninitialized: true,
  secret: process.env.REACT_APP_SESSION_SECRET,
  cookie: { 
    sameSite: 'none',
    secure: true
  }
}))
app.use(passport.initialize());
app.use(passport.session())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
  origin: ORIGIN_URL,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));
app.use(express.static('public'));
app.enable("trust proxy");

// Passport Routes

app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  failureRedirect: ORIGIN_URL 
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    successRedirect: ORIGIN_URL,
    failureRedirect: ORIGIN_URL 
  }),
  (req, res) => {
    res.redirect('/');
  });

app.get("/auth/logout", (req, res) => {
  req.logout();
  res.redirect(ORIGIN_URL);
});

app.get('/user/sync', (req, res) => {
  if(!req.user) res.send({});
  else res.send(req.user);
})

app.post('/user/update', (req, res) => {

  // Sort into alphabetical order
  const favourites = req.body.user.favourites.sort((a, b) => a.name.localeCompare(b.name));
  const watchlist = req.body.user.watchlist.sort((a, b) => a.name.localeCompare(b.name));

  User.findOneAndUpdate(
    { userId: req.user.userId },
    { $set: { 
        favourites,
        watchlist
      }})
    .then(() => { res.send('success') })
    .catch((e) => { 
      res.send('fail'); 
      console.log(e) 
    })
})

app.get('/upcoming', (req, res) => {
  fetch(`https://api.rawg.io/api/games?key=${rawgApiKey}&dates=${Dates.currDateString},${Dates.threeMonthsForwardString}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { res.send(data)})
  .catch(e => console.log(e));
})

app.get('/popular', (req, res) => {
  fetch(`https://api.rawg.io/api/games?key=${rawgApiKey}&dates=${Dates.threeMonthsAgoString},${Dates.currDateString}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { res.send(data)});
})

app.get('/game/:gameId', (req, res) => {
  fetch(`https://api.rawg.io/api/games/${req.params.gameId}?key=${rawgApiKey}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const returnData = RouteHandlers.handleGame(data);
    res.send(returnData)
  });
})

app.get('/game/:gameId/suggested', (req, res) => {
  fetch(`https://api.rawg.io/api/games/${req.params.gameId}/suggested?key=${rawgApiKey}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const array = data.results.slice(0, 6);
    res.send({ array })
  });
})

app.get('/screenshots/:gameId', (req, res) => {
  fetch(`https://api.rawg.io/api/games/${req.params.gameId}/screenshots?key=${rawgApiKey}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const array = data.results;
    res.send({ array })
  })
})

app.get('/browse/:dates/:ordering', (req, res) => {
  fetch(`https://api.rawg.io/api/games?dates=${req.params.dates}&ordering=${req.params.ordering}&key=${rawgApiKey}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const array = RouteHandlers.handleSearchResults(data);
    res.send({ array })
  })
})

app.get('/search/:query', (req, res) => {
  fetch(`https://api.rawg.io/api/games?search=${req.params.query}&key=${rawgApiKey}`, {
    method: 'GET',
    headers: rawgApiHeaders
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const array = RouteHandlers.handleSearchResults(data);
    res.send({ array })
  })
})

app.listen(PORT, () => {
  console.log('listening on' + PORT);
})