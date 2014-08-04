// Require stuff
var request = require('request');
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

// Database models
var VideoSchema = mongoose.Schema({
  _id: String,
  title: String,
  pure_likes: Number,
  likes: Number,
  dislikes: Number
});

var Video = mongoose.model('Video', VideoSchema);

// Functions
function update_video(vid) {
  var baseurl = 'https://www.googleapis.com/youtube/v3';
  var url = baseurl + '/videos';
  url += '?part=snippet,statistics,status';
  url += '&id=' + vid;
  url += '&key=' + process.env.GOOGLE_API_KEY;

  console.log("muh url is " + url);

  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      var stuff = JSON.parse(body);

      if (stuff.items.length > 0) {
        var v = stuff.items[0];
        var cur_vid = new Video();
        cur_vid._id = vid;
        cur_vid.title = v.snippet.title;
        cur_vid.likes = v.statistics.likeCount;
        cur_vid.dislikes = v.statistics.dislikeCount;
        if (cur_vid.dislikes == 0) {
          cur_vid.pure_likes = cur_vid.likes;
        }
        cur_vid.save(function (err, video) {
          if (err) return console.error(err);
        });

        console.log("jitsu wa, i really like " + cur_vid.likes);
      }
    }
  });
}

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
  Video.find({}).sort('-pure_likes').exec(function (err, videos) {
    if (err) console.error(err);
    res.render('home', { videos: videos });
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
