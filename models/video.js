var mongoose = require('mongoose');

// Database models
var VideoSchema = mongoose.Schema({
  _id: String,
  title: String,
  pure_likes: Number,
  likes: Number,
  dislikes: Number
});

var Video = mongoose.model('Video', VideoSchema);

module.exports = Video;
