var socket = io.connect('http://localhost:3000/');

function ce(type) {
    var e = $(document.createElement(type));
    for (var i = 1; i < arguments.length; i++) {
        e.addClass(arguments[i]);
    }
    return e;
}

function populatePage(data) {
    $('#other-players').empty();
    for (var p in data.players) {
        // console.log(data.players[p]);
        var d = ce('div', 'player-info');
        d.append(
            ce('h1').text(data.players[p].name),
            ce('p').text(data.players[p].lives + ' lives'),
            ce('p').text(data.players[p].hand + ' cards')
        );
        if (data.players[p].active === true) d.addClass('green');
        // console.log(d);
        $('#other-players').append(d);
    }
    $('#my-cards').empty();
    for (var c in data.cards) {
        // NOTE: Using let fixes scope issues that arrise when var is used.
        //       Note sure how compatible it is though...
        let name = data.cards[c];
        var img = ce('img');
        img.attr('src', '/static/images/cardback.png');
        img.on('click', function() {
            console.log('Playing card:', name);
            socket.emit('playcard', name);
        });
        $('#my-cards').append(img);
    }
}

function uuid() {
    // SOURCE: http://stackoverflow.com/a/2117523/2002307
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

socket.on('connect', function() {
    console.log('Connected!', arguments);
});

socket.on('gamestate', function(data) {
    console.log('Got game state from server', data);
    populatePage(data);
});

socket.on('ask name', function(data) {

});
