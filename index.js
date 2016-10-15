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

server.listen(8080, function() {
    console.log('listening on *:8080');
});

var thegame = new Game();

var usernames = {};

io.on('connection', function(socket) {

    console.log('Someone connected via socket.io');

    let player_id = undefined;
    let player_name = undefined;

    socket.on('playcard', function(data) {
        // console.log('Player tried to play card:', data);
        thegame.playCard(player_id, data.card);
        socket.emit('gamestate', thegame.getPlayerVision(player_id));
    });

    socket.on('say name', function(data) {
        console.log('Player registered:', data.name, data.uuid);
        usernames[data.uuid] = data.name;
        player_name = data.name;
        player_id = data.uuid;
        thegame.addPlayer(data.uuid, data.name);
    });

    socket.on('deal', function() {
        thegame.deal();
    });

    socket.on('ask state', function(player_id) {
        socket.emit('gamestate', thegame.getPlayerVision(player_id));
    });

    socket.on('disconnect', function() {
        thegame.disconnectPlayer(player_id);
    });

    socket.emit('ask name');
    // socket.emit('gamestate', );

});
