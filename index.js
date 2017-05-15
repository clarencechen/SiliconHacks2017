var express = require('express'),
    path = require('path');
    app = express(),
    port = 3000,
    bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var routes = require('./api/routes/routes.js');
routes(app);
app.use(express.static(__dirname + '/public')));

app.listen(port);

console.log("working on 3000");
