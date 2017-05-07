'use strict';
// load the Cloudant library
var cloudantURL = "https://azincencorrioduchignoody:7d392fbae6755d3aab27bdb441c2b6a1ae879194@38255844-f351-4ae0-9d53-5774023e3cf4-bluemix.cloudant.com"
var Cloudant = require('cloudant'),
  cloudant = Cloudant({
    url: cloudantURL
  }),
  db = cloudant.db.use("users");
var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');
var personality_insights = new PersonalityInsightsV3({
  username: "93e6cb64-66d2-4cc0-8985-820705f4a9e7",
  password: "d23FHCpyRFsb",
  version_date: '2017-12-31'
});

var twitter = require('./twitter.js');

var vQue = [];
var tQue = [];

// create a document
var createDocument = function(newUser, callback) {
  console.log("Creating document 'mydoc'");
  // we are specifying the id of the document so we can update and delete it later
  db.insert(newUser, function(err, data) {
    console.log("Error:", err);
    console.log("Data:", data);
    callback(err, data);
  });
};

//login
exports.get_user = function(req, res) {
  var username = req.params.username;
  var password = req.params.password;

  //if db contains username, check password
  db.find({
    "selector": {
      "$and": [{
          "username": username
        },
        {
          "password": password
        }
      ]
    }
  }, function(er, result){
      console.log(er);
      console.log(result);
      res.json(result);
  });
};

//
exports.get_match_video = function(req, res) {
  
if (vQue.length === 0)
{
  var usr = req.body.user;
  var peer = req.body.peer;
  vQue.push({user: usr, peer: peer});

  res.status(500).send('Wait');
}
else
{
  var stuff = vQue.pop();
  console.log('pop: ', stuff);
  res.json(stuff);
}

};

exports.get_match_text = function(req, res){
  if (tQue.length === 0)
  {
    var usr = req.body.user;
    var peer = req.body.peer;
    tQue.push({user: usr, peer: peer});
    res.status(500).send('Wait');
  }
  else
  {
    var stuff = tQue.pop();
    console.log('pop: ', stuff);
    res.json(stuff);
  }
};

exports.watson = function(req, res){
  var tweetarr = twitter.getTweets(req.body.twitter);
  var corpus = JSON.stringify(tweetarr).replace('","', '\n')
  var params = {
  // Get the content items from the JSON file.
  text : corpus,
  headers: {
    'accept-language': 'en',
    'accept': 'application/json',
    'consumption_preferences' : true
  }
  };
  personality_insights.profile(params, function(error, response) {
    if (error)
      console.log('Error:', error);
    else
    {
      console.log('done!');
      var hobbies = process(response)
      res.json(hobbies)
    }
  });
}
function process(response) {
  var hobbies = []
  var preferencecats = response.consumption_preferences
  for(var pc in preferencecats)
  {
    if(pc.consumption_preference_category_id == "consumption_preferences_health_and_activity")
    {
      for(var p in pc.consumption_preferences)
      {
        if(p.score > 0.8)
        {
          hobbies.push(p.name)
        }
      }
    }
  }
  return hobbies;
}