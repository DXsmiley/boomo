var express = require('express');
var pug = require('pug');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// var uuid = require('uuid');
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
        thegame.playCard(data.player_id, data.card);
        socket.emit('gamestate', thegame.getPlayerVision(data.player_id));
    });

    socket.on('say name', function(data) {
        console.log('Player registered:', data.name, data.uuid);
        usernames[data.uuid] = data.name;
        thegame.addPlayer(data.uuid, data.name);
    });

    socket.on('deal', function() {
        thegame.deal();
    });

    socket.on('ask state', function(player_id) {
        socket.emit('gamestate', thegame.getPlayerVision(player_id));
    });

    socket.emit('ask name');
    // socket.emit('gamestate', );

});
