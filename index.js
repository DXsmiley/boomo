var express = require('express');
var pug = require('pug');
var app = express();

app.use('/static', express.static(__dirname + '/static/'));

app.get('/', function(req, res) {
    res.send(pug.renderFile(__dirname + '/templates/index.pug'));
});

app.get('/game', function(req, res) {
    res.send(pug.renderFile(__dirname + '/templates/game.pug'));
});

app.listen(3000, function() {
    console.log('listening on *:3000');
});
