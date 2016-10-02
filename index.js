var express = require('express');
var pug = require('pug');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('uuid');
var Game = require('./game.js');

app.use('/static', express.static(__dirname + '/static/'));

app.get('/', function(req, res) {
    res.send(pug.renderFile(__dirname + '/templates/index.pug'));
});

app.get('/game', function(req, res) {
    res.send(pug.renderFile(__dirname + '/templates/game.pug'));
});

server.listen(3000, function() {
    console.log('listening on *:3000');
});

var thegame = new Game();

var usernames = {};

io.on('connection', function(socket) {
    console.log('Someone connected via socket.io');


    socket.on('playcard', function(data) {
        console.log('Player tried to play card:', data);
        // Wow, a stub!
    });

    socket.on('say name', function(data) {
        usernames[data.uuid] = data.name;
    });

    socket.emit('ask name', uuid.v4());
    // socket.emit('gamestate', );

});
