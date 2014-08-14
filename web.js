// Require stuff
var express = require('express');
var bodyParser = require('body-parser');
var logfmt = require('logfmt');
var mongoose = require('mongoose');

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
  Video.find({})
  .where('dislikes').equals(0)
  .sort('-pure_likes')
  .exec(function (err, videos) {
    if (err) console.error(err);
    res.render('home', { title: 'Home', videos: videos });
  });
});
app.get('/hall-of-fame', function(req, res) {
  Video.find({})
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

// Start everything
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
