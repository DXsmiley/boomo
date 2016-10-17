var socket = io.connect();

function ce(type) {
    var e = $(document.createElement(type));
    for (var i = 1; i < arguments.length; i++) {
        e.addClass(arguments[i]);
    }
    return e;
}

var last_update = undefined;

const CARD_CHANGES_NUMBER = {
    '5': true,
    '10': true,
    'draw1': false,
    'draw2': false,
    'defuse': false,
    'boomo': false,
    'set0': true,
    'set60': true,
    'set30': true,
    'skip': false,
    'reverse': false,
    'play2': false
};

function populatePage(data) {
    if (data.stamp != last_update) {
        last_update = data.stamp;
        $('#other-players').empty();
        for (var p in data.players) {
            // console.log(data.players[p]);
            var d = ce('div', 'player-info');
            d.append(
                ce('h1').text(data.players[p].name),
                ce('p').text(data.players[p].lives + ' lives'),
                ce('p').text(data.players[p].handsize + ' cards')
            );
            if (data.players[p].connected === false) d.addClass('red');
            else if (data.players[p].lives === 0) d.addClass('grey');
            else if (data.players[p].active === true) d.addClass('green');
            // console.log(d);
            $('#other-players').append(d);
        }
        $('#my-cards').empty();
        for (var c in data.hand) {
            // NOTE: Using let fixes scope issues that arrise when var is used.
            //       Note sure how compatible it is though...
            let name = data.hand[c];
            var img = ce('img');
            // TODO: Proper card images.
            img.attr('src', '/static/images/card_' + name + '.png');
            if (data.blur_non_numbers && !CARD_CHANGES_NUMBER[name]) img.addClass('blur');
            img.on('click', function() {
                console.log('Playing card:', name);
                socket.emit('playcard', {player_id: player_id, card: name});
            });
            $('#my-cards').append(img);
        }
        $('#bomb-timer').text(data.timer);
        $('#discard-pile').attr('src', '/static/images/card_' + data.discard + '.png');
    }
}

function cookieDefault(cookie, def) {
    var c = Cookies.get(cookie);
    if (c === undefined) c = def;
    Cookies.set(cookie, c);
    return c;
}

function uuid() {
    // SOURCE: http://stackoverflow.com/a/2117523/2002307
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function forceDeal() {
    socket.emit('deal');
}

var player_id = cookieDefault('userid', uuid());
var player_name = cookieDefault('username', 'Guest');

console.log(player_id, player_name);

socket.on('connect', function() {
    console.log('Connected!', arguments);
});

socket.on('gamestate', function(data) {
    console.log('Got game state from server', data);
    populatePage(data);
});

socket.on('ask name', function(data) {
    socket.emit('say name', {
        uuid: player_id,
        name: player_name
    });
});

setInterval(function () {
    socket.emit('ask state', player_id);
}, 500);
