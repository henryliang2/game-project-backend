const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const handleGame = (data) => {
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

  return data;
}

const handleSearchResults = (data) => {
  const maxResults = 18;
  const array = [];
  data.results.forEach(game => {
    if(game.background_image && array.length < maxResults) { 
      array.push(game) 
    }
  })

  return array
}

module.exports = {
  handleGame,
  handleSearchResults
}