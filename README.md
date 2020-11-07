# The Game Project

Game Project is a website to browse through trending and popular games. 

See the project hosted at https://gameproject.netlify.app

The server is hosted at https://game-project-server.herokuapp.com

Game Project was built using React, HTML/CSS, SASS, Express, and MongoDB. Authentication was  
implemented with Passport.js using OAuth 2.0 flow. Figma and Adobe Creative Suite were used  
for prototyping and design. All animations and effects were made using CSS.

Repository for front-end portion of the project at https://github.com/henryliang2/game-project

## Example Routes

    GET /upcoming

Returns an array of anticipated games that are being released within the next 3 months.

    GET /popular

Returns an array of popular games released in the last 3 months.

    GET /game/{gameID}
    
Returns detailed information about a specific game based on the game's unique identifier.

    GET /screenshots/{gameID}
    
Returns an array of screenshots from a specific game based on the game's unique identifier.

    GET /search/{query}
    
Returns a list of video games with titles matching the query.

    GET /user/sync
    
Returns an object containing the user's data. Credentials required.

    POST /user/update
    
Updates user in database using the user object sent by the client. Credentials required.

## Resources Used

Stack: React, Express, MongoDB, SASS  
API: [RAWG api](https://api.rawg.io/docs/)  
Icons: [Material-UI](https://material-ui.com/)
