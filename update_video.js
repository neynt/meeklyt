var kue = require('kue')
  , url = require('url')
  , request = require('request')
  , Video = require('./models/video');

var redisUrl = url.parse(process.env.REDISCLOUD_URL)
var jobs = kue.createQueue({
  redis: {
    port: redisUrl.port,
    host: redisUrl.hostname,
    auth: redisUrl.auth.split(":")[1]
  }
});

function update_video(vid) {
  var job = jobs.create('new job', { vid: vid });

  job
    .on('complete', function() {
      console.log('Job for ' + vid + ' complete');
    })
    .on('failed', function() {
      console.log('Job for ' + vid + ' failed');
    })

  job.save();
}

jobs.process('new job', function(job, done) {
  var baseurl = 'https://www.googleapis.com/youtube/v3';
  var url = baseurl + '/videos';
  var vid = job.data.vid;

  url += '?part=snippet,statistics,status';
  url += '&id=' + vid;
  url += '&key=' + process.env.GOOGLE_API_KEY;

  console.log("Making API call for video " + vid);

  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body);
      var stuff = JSON.parse(body);

      if (stuff.items.length > 0) {
        var v = stuff.items[0];
        var cur_vid = {};
        cur_vid.title = v.snippet.title;
        cur_vid.likes = v.statistics.likeCount;
        cur_vid.dislikes = v.statistics.dislikeCount;
        cur_vid.viewCount = v.statistics.viewCount;

        var exp = Math.floor(Math.log(cur_vid.viewCount)/Math.LN10);
        if (exp >= 4) exp -= 1;
        var r = Math.pow(10, exp);
        var lower = Math.floor(cur_vid.viewCount/r)*r;
        cur_vid.viewRange = lower + '+';

        cur_vid.publishedAt = v.snippet.publishedAt;
        cur_vid.last_update = new Date();
        cur_vid.valid = true;

        if (cur_vid.dislikes == 0) {
          cur_vid.pure_likes = cur_vid.likes;
        }
        Video.update({_id: vid}, cur_vid, {upsert: true}, function (err) {
          if (err) console.error('err: ' + err);
        });

        done();
      }
      else {
        var cur_vid = {};
        cur_vid.valid = false;
        Video.update({_id: vid}, cur_vid, {upsert: true}, function (err) {
          if (err) console.error('dead video: ' + err);
        });
        done('video is dead');
      }
    }
    done('failed to retrieve video');
  });
});

module.exports = update_video;
