const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  userId: String,
  displayName: String,
  email: String,
  image: String,
  favourites: Array,
  watchlist: Array
});

module.exports = mongoose.model('User', userSchema);