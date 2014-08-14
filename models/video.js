var mongoose = require('mongoose');

// Database models
var VideoSchema = mongoose.Schema({
  _id: String,
  title: String,
  pure_likes: Number,
  likes: Number,
  dislikes: Number,
  last_update: {type: Date, default: function() { return Date(0); }},
  valid: {type: Boolean, default: function() { return true; }}
});

var Video = mongoose.model('Video', VideoSchema);

module.exports = Video;
