'use strict';
module.exports = function(app) {
  var bigboss = require('../controllers/controller.js');
  
  //login
  app.route('/user/:username/:password')
     .get(bigboss.get_user)

  //match
  app.route('/match_video')
    .post(bigboss.get_match_video)
  app.route('/match_text')
    .post(bigboss.get_match_text)
  app.route('/watson')
  .post(bigboss.watson)
}
