var shuffle = require('shuffle-array');

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
    'play2': 0    // next player players 2 cards
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
    this.player_order = [];
    this.players = {};
    this.deck = [];
    this.discard = [];
    this.active_index = 0;
    this.play_direction = 1;
    this.bomb_timer = 0;
    this.stamp = 0;
    this.alive_count = 0;
    this.last_played = 'boomo';
};

Game.prototype.addPlayer = function(id, name) {
    if (this.players[id] === undefined) {
        this.player_order.push(id);
        this.players[id] = {
            name: name,
            hand: [],
            lives: 0,
            turns_to_take: 0,
            active: true,
            connected: true
        };
        console.log('The player goined the game.')
    } else {
        console.log('The player re-joined the game.');
        this.players[id].connected = true;
    }
    this.stamp++;
};

Game.prototype.disconnectPlayer = function(id, name) {
    if (this.players[id] !== undefined) {
        this.players[id].connected = false;
        this.stamp++;
    }
}

Game.prototype.nextPlayerInCycle = function() {
    var next = this.active_index;
    do {
        next = next + this.play_direction;
        if (next == -1) next = this.player_order.length - 1;
        if (next == this.player_order.length) next = 0;
    } while (this.alive_count > 1 && this.players[this.player_order[next]].lives == 0);
    return this.players[this.player_order[next]];
}

// TODO: Change this to take the player ID, not the player object.
Game.prototype.playerLooseLife = function(player) {
    if (this.players[player].lives > 0) {
        this.players[player].lives -= 1;
        if (this.players[player].lives == 0) {
            this.alive_count -= 1;
        }
    }
}

Game.prototype.playerDrawCards = function(player, number) {
    for (var i = 0; i < number; i++) {
        if (this.deck.length == 0) this.deck = newDeck();
        this.players[player].hand.push(this.deck.pop());
    }
}

Game.prototype.advanceActivePlayer = function() {
    if (this.alive_count > 1) {
        var next = this.active_index + this.play_direction;
        if (next == -1) next = this.player_order.length - 1;
        if (next == this.player_order.length) next = 0;
        this.active_index = next;
        var p = this.players[this.player_order[next]];
        if (p.lives == 0) {
            // XXX: This needs to be put back in when lives are properly implemented.
            this.advanceActivePlayer();
        } else {
            if (p.turns_to_take < 0) {
                p.turns_to_take += 1;
                this.advanceActivePlayer();
            }
        }
    }
}

Game.prototype.allDraw = function(number, exclude) {
    for (var p in this.players) {
        if (this.players[p].lives > 0 && p != exclude) {
            this.playerDrawCards(p, number);
        }
    }
}

Game.prototype.checkHandOut = function(player) {

}

Game.prototype.playCard = function(player, card) {
    // console.log(player, this.player_order);
    if (this.alive_count > 1) {
        if (this.player_order[this.active_index] != player) {
            console.log('Player tried to play out of turn');
        } else {
            var hand = this.players[player].hand;
            if (hand.includes(card)) {
                hand.splice(hand.indexOf(card), 1);
                this.discard.push(card);
                this.last_played = card;
                if (card == '5') this.bomb_timer += 5;
                if (card == '10') this.bomb_timer += 10;
                if (card == 'set0') this.bomb_timer = 0;
                if (card == 'set30') this.bomb_timer = 30;
                if (card == 'set60') this.bomb_timer = 60;
                if (card == 'skip') this.nextPlayerInCycle().turns_to_take -= 1;
                if (card == 'draw1') this.allDraw(1, player);
                if (card == 'draw2') this.allDraw(2, player);
                if (card == 'reverse') this.play_direction *= -1;
                if (card == 'boomo') {
                    var num_hits = 0;
                    for (var p in this.players) {
                        if (this.players[p].lives > 0 && p != player) {
                            var h = this.players[p].hand;
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
                    console.log(player, 'losy life');
                    this.playerLooseLife(player);
                    this.bomb_timer = 0;
                }
                for (var i in this.players) {
                    if (this.players[i].hand.length == 0) {
                        for (var p in this.players) {
                            if (p != i) this.playerLooseLife(p);
                        }
                        this.playerDrawCards(player, 7);
                    }
                }
                this.advanceActivePlayer();
                this.stamp++;
            } else {
                console.warn('A player tried to play a card they did not have');
            }
        }
    }
};

Game.prototype.deal = function() {
    this.deck = newDeck();
    this.player_order = [];
    this.alive_count = 0;
    for (var i in this.players) {
        var p = this.players[i];
        if (p.connected) {
            console.log(i, this.players[p]);
            if (p.active) {
                p.hand = [];
                this.playerDrawCards(i, 7);
            }
            p.lives = 3;
            p.turns_to_take = 0;
            this.alive_count++;
            this.player_order.push(i);
        }
    }
    this.bomb_timer = 0;
    this.active_index = 0;
    this.stamp++;
}

Game.prototype.getPlayerVision = function(player) {
    if (this.player_order.length == 0) {
        return {
            players: [],
            timer: 0,
            hand: [],
            stamp: -1
        }
    } else {
        var players = [];
        for (var i in this.player_order) {
            var p = this.players[this.player_order[i]];
            players.push({
                name: p.name,
                handsize: p.hand.length,
                lives: p.lives,
                connected: p.connected
            });
        }
        // console.log(players);
        players[this.active_index].active = true;
        return {
            players: players,
            timer: this.bomb_timer,
            hand: this.players[player] === undefined ? [] : this.players[player].hand,
            stamp: this.stamp,
            discard: this.last_played
        }
    }
}

module.exports = Game;
