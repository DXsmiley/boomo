var shuffle = require('shuffle-array');

var Player = require('./player');
var nwrap = require('./nwrap');

// This is a single game instance, which holds information about the state of a game.

const CARD_NUMBERS = {
    '5': 10,      // incrases timer by 5
    '10': 15,     // increases timer by 10
    'swap': 0,    // swap cards with another player
    'draw1': 3,      // everyone draws one card
    'draw2': 1,      // everyone draws two cards
    'defuse': 6, // used to counter a boomo
    'boomo': 1,   // makes everyone explode
    'set0': 3,    // set the couter to 1
    'set60': 2,   // set the counter to 2
    'set30': 4,   // set the counter to 2
    'skip': 6,    // skip the next player
    'reverse': 4, // reverse the play order
    'play2': 4    // next player players 2 cards
};

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

const TOTAL_CARDS = Object.keys(CARD_NUMBERS).reduce((sum, key) => sum + CARD_NUMBERS[key]);

function makeCardListing(cards) {
    var ar = [];
    for (var c in CARD_NUMBERS) {
        for (var i = 0; i < CARD_NUMBERS[c]; i++) {
            ar.push(c);
        }
    }
    return ar;
}

const CARD_LISTING = makeCardListing(CARD_NUMBERS);

function newDeck() {
    return shuffle(CARD_LISTING.slice(), {copy: true});
}

function Game() {
    // Use an actual map so iteration is nice.
    this.players = new Map();
    this.deck = [];
    this.discard = [];
    this.active_player = undefined;
    this.play_direction = 1;
    this.bomb_timer = 0;
    this.stamp = 0;
    this.alive_count = 0;
    this.last_played = 'boomo';
    this.first_player = undefined;
};

Game.prototype.addPlayer = function(id, name) {
    if (this.players.get(id) === undefined) {
        // this.player_order.push(id);
        this.players.set(id, new Player(id, name));
        console.log('Player', name, 'joined the game.')
    } else {
        console.log('The player re-joined the game.');
        this.players.get(id).connected = true;
        this.players.get(id).name = name;
    }
    this.stamp++;
};

Game.prototype.getPlayer = function(object, def) {
    if (!(object instanceof Player)) object = this.players.get(object);
    if (object === undefined) object = def;
    return object;
};

Game.prototype.disconnectPlayer = function(id) {
    this.getPlayer(id, {}).connected = false;
    this.stamp++;
}

// Game.prototype.playerOrderd = function(index) {
//     return this.players[this.player_order[index]];
// }

Game.prototype.nextPlayerInCycle = function() {
    var next = this.active_player;
    // var bail = 0;
    do {
        console.log('stuck in nextPlayerInCycle', next);
        if (this.play_direction == 1) next = next.order.next;
        else next = next.order.prev;
        // bail += 1;
    } while (this.alive_count > 1 && next.lives == 0 /*&& bail < 100*/);
    console.log('nope');
    return next;
}

Game.prototype.playerLooseLife = function(player) {
    player = this.getPlayer(player);
    if (player.lives > 0) {
        player.lives -= 1;
        if (player.lives == 0) {
            this.alive_count -= 1;
        }
    }
}

Game.prototype.playerDrawCards = function(player, number) {
    player = this.getPlayer(player);
    for (var i = 0; i < number; i++) {
        if (this.deck.length == 0) this.deck = newDeck();
        player.hand.push(this.deck.pop());
    }
    player.hand.sort();
}

Game.prototype.advanceActivePlayer = function() {
    if (this.alive_count > 1) {
        if (this.active_player.lives > 0 && this.active_player.turns_to_take > 0) {
            this.active_player.turns_to_take -= 1;
        } else {
            do {
                console.log('stuck in advanceActivePlayer');
                if (this.play_direction == 1) this.active_player = this.active_player.order.next;
                else this.active_player = this.active_player.order.prev;
                if (this.active_player.lives > 0) {
                    if (this.active_player.turns_to_take < 0) {
                        this.active_player.turns_to_take += 1;
                    } else break;
                }
            } while (true);
            console.log('nope');
        }
    }
}

Game.prototype.allDraw = function(number, exclude) {
    for (var p of this.players.values()) {
        if (p.lives > 0 && p != this.getPlayer(exclude)) {
            this.playerDrawCards(p, number);
        }
    }
}

Game.prototype.playerHasCardWhichChangesNumber = function(player) {
    var result = false;
    for (var c of this.getPlayer(player).hand) {
        result = result || CARD_CHANGES_NUMBER[c];
    }
    return result;
};

Game.prototype.playCard = function(player, card) {
    // console.log(player, this.player_order);
    var player = this.getPlayer(player);
    if (this.alive_count > 1) {
        if (player != this.active_player) {
            console.log(player.name, 'tried to play out of turn');
        } else {
            if (player.hand.includes(card) && (player.turns_to_take == 0 || CARD_CHANGES_NUMBER[card])) {
                player.hand.splice(player.hand.indexOf(card), 1);
                this.discard.push(card);
                this.last_played = card;
                if (card == '5') this.bomb_timer += 5;
                if (card == '10') this.bomb_timer += 10;
                if (card == 'set0') this.bomb_timer = 0;
                if (card == 'set30') this.bomb_timer = 30;
                if (card == 'set60') this.bomb_timer = 60;
                if (card == 'skip') {
                    this.nextPlayerInCycle().turns_to_take -= 1;
                }
                if (card == 'play2') {
                    var next = this.nextPlayerInCycle();
                    if (this.playerHasCardWhichChangesNumber(next)) {
                        next.turns_to_take += 1;
                    } else {
                        this.playerLooseLife(next);
                    }
                }
                if (card == 'draw1') this.allDraw(1, player);
                if (card == 'draw2') this.allDraw(2, player);
                if (card == 'reverse') this.play_direction *= -1;
                if (card == 'boomo') {
                    var num_hits = 0;
                    for (var p of this.players.values()) {
                        if (p.lives > 0 && p != player) {
                            var h = p.hand;
                            if (h.includes('defuse')) {
                                h.splice(h.indexOf('defuse'), 1);
                            } else {
                                num_hits += 1;
                                this.playerLooseLife(p);
                            }
                        }
                    }
                    if (num_hits == 0) {
                        this.playerLooseLife(player);
                    }
                    this.bomb_timer = 0;
                }
                if (this.bomb_timer > 60) {
                    console.log(player.name, 'exceeded timer');
                    this.playerLooseLife(player);
                    this.bomb_timer = 0;
                }
                for (var i of this.players.values()) {
                    if (i.active && i.lives > 0 && i.hand.length == 0) {
                        console.log(i.name, 'has no cards!');
                        for (var p of this.players.values()) {
                            if (p != i) this.playerLooseLife(p);
                        }
                    }
                }
                for (var i of this.players.values()) {
                    if (i.hand.length == 0 && i.lives > 0) {
                        this.playerDrawCards(i, 7);
                    }
                }
                this.advanceActivePlayer();
                this.stamp++;
            } else {
                console.warn(player.name, 'tried to play a card they were not allowed to.');
            }
        }
    }
};

Game.prototype.deal = function() {
    this.deck = newDeck();
    player_order = [];
    for (var p of this.players.values()) {
        p.reset();
        if (p.connected) {
            this.playerDrawCards(p, 7);
            player_order.push(p);
            p.in_game = true;
        } else {
            p.in_game = false;
        }
    }
    shuffle(player_order);
    const L = player_order.length;
    // console.warn(L, player_order);
    for (var i in player_order) {
        i = parseInt(i);
        // console.log(typeof i);
        // console.log((i - 1 + L) % L, i, (i + 1) % L);
        player_order[i].setOrder(
            player_order[(i - 1 + L) % L],
            player_order[(i + 1) % L]
        );
    }
    // console.warn(player_order);
    this.bomb_timer = 0;
    this.play_direction = 1;
    this.active_player = player_order[0];
    this.first_player = player_order[0];
    this.alive_count = player_order.length;
    this.stamp++;
}

Game.prototype.playersOrdered = function() {
    var order = [];
    var limit = 0;
    if (this.alive_count > 0) {
        for (var i = this.first_player; (i != this.first_player || order.length == 0) && limit < 1000; i = i.order.next) {
            if (i.lives > 0) {
                order.push(i);
            }
            limit += 1;
        }
    }
    for (var p of this.players.values()) {
        if ((p.connected || p.in_game) && order.indexOf(p) == -1) {
            order.push(p);
        }
    }
    return order;
};

Game.prototype.getPlayerVision = function(player) {
    player = this.getPlayer(player);
    if (player === undefined) {
        return {
            players: [],
            timer: 0,
            hand: [],
            stamp: -1
        }
    } else {
        var players = [];
        for (var p of this.playersOrdered()) {
            players.push({
                name: p.name,
                handsize: p.hand.length,
                lives: p.lives,
                connected: p.connected,
                active: p == this.active_player
            });
        }
        var blur = player.lives > 0 && player.turns_to_take > 0;
        return {
            players: players,
            timer: this.bomb_timer,
            hand: player.hand,
            stamp: this.stamp,
            discard: this.last_played,
            blur_non_numbers: blur
        }
    }
}

module.exports = Game;
