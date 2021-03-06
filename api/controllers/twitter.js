/* Copyright IBM Corp. 2015
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
if (process.env.NODE_ENV !== 'production')
  process.env = require('dotenv-safe').load().parsed

const consumer = process.env.CONSUMER
const consumer_secret = process.env.CONSUMER_SECRET
const access_token = process.env.ACCESS
const access_secret = process.env.ACCESS_SECRET
const twitter = require('twitter');
const MAX_COUNT = 200;

const tweetsFor = (user) =>
  require(`../public/data/twitter/${user}_tweets.json`);

const getLocalTweets = (user) =>
  new Promise((resolve) => {
    try {
      resolve(tweetsFor(user));
    } catch(error) {
      resolve(null);
    }
  });

/**
* Get the tweets based on the given screen_name.
* Implemented with recursive calls that fetch up to 200 tweets in every call
* Only returns english and original tweets (no retweets)
*/
const getTweetsFromTwitter = (user) =>
  new Promise((resolve, reject) => {
    if (!user) {
      return reject(new Error('User handle cannot be null'));
    }
    const twit = new twitter({consumer_key: consumer,
      consumer_secret: consumer_secret,
      access_token_key: access_token,
      access_token_secret: access_secret});
    let tweets = [];
    const params = {
      screen_name: user,
      count: MAX_COUNT,
      exclude_replies: true,
      trim_user: true
    };

    const processTweets = (error, newTweets) => {
      // Check if newTweets its an error
      if (error) {
        return reject(error);
      }
      tweets = tweets.concat(newTweets.filter((tweet) => !tweet.retweeted));

      if (newTweets.length > 1) {
        params.max_id = newTweets[newTweets.length-1].id - 1;
        return twit.get('statuses/user_timeline', params, processTweets);
      } else {
        return resolve(tweets);
      }
    };

    twit.get('statuses/user_timeline', params, processTweets);
  });

const getTweets = (user) =>
  getLocalTweets(user)
    .then((tweets) =>
      tweets ? tweets : getTweetsFromTwitter(user)
    );


module.exports = { getTweets };