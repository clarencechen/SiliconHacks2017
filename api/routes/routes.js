'use strict';
module.exports = function(app) {
  var YDD = require('../controllers/controller.js');
  
  //login
  app.route('/user/:username/:password')
     .get(YDD.get_user)
  app.route('/new_user')
  .post(YDD.new_user)
  //match
  app.route('/match_text')
  .post(YDD.get_match_text)
  app.route('/watson')
  .post(YDD.watson)
  app.route('/translate')
  .post(YDD.translate)
}
