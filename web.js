// Require stuff
var express = require('express');
var bodyParser = require('body-parser');
var logfmt = require('logfmt');
var mongoose = require('mongoose');
var moment = require('moment');

var mongoUri = process.env.MONGOHQ_URL
  || 'mongodb://localhost/mydb';
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // yay!
});

// Models
var Video = require('./models/video');

// Functions
var update_video = require('./update_video');

// Middleware
var app = express();
var pub = __dirname + '/public';
app.use(express.static(pub));
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// Views directory
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  Video.find()
  .where('dislikes').equals(0)
  .where('valid').equals(true)
  .sort('-pure_likes')
  .exec(function (err, videos) {
    if (err) console.error(err);
    res.render('home', { title: 'Home', videos: videos });
  });
});
app.get('/hall-of-fame', function(req, res) {
  Video.find()
  .where('dislikes').gt(0)
  .sort('-pure_likes')
  .exec(function (err, videos) {
    if (err) console.error(err);
    res.render('home', { title: 'Hall of Fame', videos: videos });
  });
});
app.route('/ret')
.post(function(req, res, next) {
  var vidid = /\?v=(.*?)(&|$)/.exec(req.param('vid'));
  if (vidid && vidid.length > 1) {
    update_video(vidid[1]);
  }
  res.redirect('/');
});

// Update videos every so often
setInterval(function() {
  console.log("Starting video update...")
  Video.find()
  .where('dislikes').equals(0)
  .exec(function (err, videos) {
    if (err) console.error(err);
    videos.forEach(function(v) {
      var update_time = 60000;
      var time_from = new Date() - v.last_update;
      console.log("vid time is " + time_from);
      if (time_from >= update_time) {
        console.log("starting update of video " + v._id);
        update_video(v._id);
      }
      else {
        console.log("skipping video " + v._id);
      }
    }); 
  });
}, 10000);

// Start everything
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
