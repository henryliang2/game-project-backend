const express = require('express');
const fetch = require('node-fetch')
const cors = require('cors');
const app = express();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
require('dotenv').config()

const PORT = process.env.PORT || 8080;
const api_key = process.env.REACT_APP_RAWG_API_KEY;

app.use(cors());

// dates
const currDate = new Date();
let threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(currDate.getMonth() - 3);
const currDateString = currDate.toISOString().slice(0, 10);
const threeMonthsAgoString = threeMonthsAgo.toISOString().slice(0, 10);
let threeMonthsForward = new Date();
threeMonthsForward.setMonth(currDate.getMonth() + 3);
const threeMonthsForwardString = threeMonthsForward.toISOString().slice(0, 10);

app.get('/upcoming', (req, res) => {
  fetch(`https://api.rawg.io/api/games?key=${api_key}&dates=${currDateString},${threeMonthsForwardString}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent'  : 'Game-Showcase Personal Web Development Portfolio Project'
    }
  })
  .then(jsonData => jsonData.json())
  .then(data => { res.send(data)});
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
  .then(data => { console.log(data); res.send(data)});
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

app.listen(PORT, () => {
  console.log(PORT)
})