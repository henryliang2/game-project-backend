const express = require('express');
const fetch = require('node-fetch')
const cors = require('cors');
const app = express();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User.js');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const PassportConfig = require('./PassportConfig');

const PORT = process.env.PORT || 8080;
const api_key = process.env.REACT_APP_RAWG_API_KEY;

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
    sameSite: 'lax' // change to { sameSite: 'none', secure: true } before deployment
  }
}))
app.use(passport.initialize());
app.use(passport.session())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));
app.use(express.static('public'));
app.enable("trust proxy");

// Passport Routes

app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  failureRedirect: 'http://localhost:3000' 
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    successRedirect: 'http://localhost:3000',
    failureRedirect: 'http://localhost:3000' 
  }),
  (req, res) => {
    res.redirect('/');
  });

app.get("/auth/logout", (req, res) => {
  req.logout();
  res.redirect('http://localhost:3000');
});

// dates
const currDate = new Date();
let threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(currDate.getMonth() - 3);
const currDateString = currDate.toISOString().slice(0, 10);
const threeMonthsAgoString = threeMonthsAgo.toISOString().slice(0, 10);
let threeMonthsForward = new Date();
threeMonthsForward.setMonth(currDate.getMonth() + 3);
const threeMonthsForwardString = threeMonthsForward.toISOString().slice(0, 10);

app.get('/user/sync', (req, res) => {
  if(!req.user) res.json({});
  else res.json(req.user);
})

app.post('/user/update', (req, res) => {
  User.findOneAndUpdate(
    { userId: req.user.userId },
    { $set: { 
        favourites: req.body.user.favourites,
        watchlist: req.body.user.watchlist
      }
    })
    .then(() => { 
      console.log('success')
      res.send('success')
    })
    .catch(() => { 
      console.log('fail')
      res.send('fail')
    })
})

app.get('/upcoming', (req, res) => {
  fetch(`https://api.rawg.io/api/games?key=${api_key}&dates=${currDateString},${threeMonthsForwardString}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { res.send(data)})
  .catch(e => console.log(e));
})

app.get('/popular', (req, res) => {
  fetch(`https://api.rawg.io/api/games?key=${api_key}&dates=${threeMonthsAgoString},${currDateString}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { res.send(data)});
})

app.get('/game/:gameId', (req, res) => {
  fetch(`https://api.rawg.io/api/games/${req.params.gameId}?key=${api_key}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const dom = new JSDOM(data.description);
    let description = '';
    const paragraphs = dom.window.document.getElementsByTagName('p');
    for(let i=0; i < paragraphs.length; i++) {
      if(paragraphs[i].textContent.length < 12) continue;
      description += `${paragraphs[i].textContent}. `
    }
     description = description.split('..').join('.');
     if (description.length > 400) description = description.slice(0, 1000) + '...';
    data.description_string = description;
    data.stars = Math.round(data.rating * 2) / 2;
    res.send(data)
  });
})

app.get('/screenshots/:gameId', (req, res) => {
  fetch(`https://api.rawg.io/api/games/${req.params.gameId}/screenshots?key=${api_key}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const array = data.results;
    res.send({ array })
  })
})

app.get('/browse/:dates/:ordering', (req, res) => {
  fetch(`https://api.rawg.io/api/games?dates=${req.params.dates}&ordering=${req.params.ordering}&key=${api_key}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const maxResults = 18;
    const array = [];
    data.results.forEach(game => {
      if(game.background_image && array.length < maxResults) { 
        array.push(game) 
      }
    })
    res.send({ array })
  })
})

app.get('/search/:query', (req, res) => {
  fetch(`https://api.rawg.io/api/games?search=${req.params.query}&key=${api_key}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { 
    const maxResults = 18;
    const array = [];
    data.results.forEach(game => {
      if(game.background_image && array.length < maxResults) { 
        array.push(game) 
      }
    })
    res.send({ array })
  })
})

app.listen(PORT, () => {
  console.log(PORT)
})