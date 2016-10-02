// This is a single game instance, which holds information about the state of a game.

const CARD_NUMBERS = [
    '5': 10,      // incrases timer by 5
    '10': 15,     // increases timer by 10
    'swap', 2,    // swap cards with another player
    '+1', 2,      // everyone draws one card
    '+2', 1,      // everyone draws two cards
    'defuse': 10, // used to counter a boomo
    'boomo': 2,   // makes everyone explode
    'set0': 1,    // set the couter to 1
    'set60': 2,   // set the counter to 2
    'set30': 1,   // set the counter to 2
    'skip': 4,    // skip the next player
    'reverse': 4, // reverse the play order
    'play2': 2    // next player players 2 cards
];

const TOTAL_CARDS = Object.keys(CARD_NUMBERS).reduce((sum, key) => sum + CARD_NUMBERS[key]);

function makeCardListing(cards) {
    var ar = [];
    for (var c : CARD_NUMBERS) {
        for (var i = 0; i < CARD_NUMBERS[c]; i++) {
            ar.push(c);
        }
    }
    return ar;
}

const CARD_LISTING = makeCardListing(CARD_NUMBERS);

function Game() {
    this.player_order = [];
    this.players = {};
    this.deck = [];
    this.discard = [];
    this.active_index = 0;
    this.play_direction = 1;
    this.bomb_timer = 0;
};

Game.prototype.addPlayer = function(id, name) {
    if (this.players[id] === undefined) {
        this.player_order.push(id);
        this.players[id] = {
            name: name,
            hand: [],
            lives: 0,
            turns_to_take: 0
        };
    } else {
        console.warn('A player who was already in a game joined the game.');
    }
};

Game.prototype.nextPlayerInCycle = function() {
    var next = this.active_index;
    do {
        next = next + this.play_direction;
        if (next == -1) next = this.player_order.length - 1;
        if (next == this.player_order.length) next = 0;
    } while (this.players[this.player_order[cur]].lives == 0);
    return this.players[this.player_order[next]];
}

Game.prototype.playerLooseLife = function(player, card) {
    if (player.lives > 0) {

    }
}

Game.prototype.playerDrawCards = function(player, number) {
    for (var i = 0; i < number; i++) {
        this.players[player].hand.push(this.deck.pop());
    }
}

Game.prototype.advanceActivePlayer = function() {
    var next = this.active_index + this.play_direction;
    if (next == -1) next = this.player_order.length - 1;
    if (next == this.player_order.length) next = 0;
    var p = this.players[this.player_order[next]];
    if (p.lives == 0) {
        this.advanceActivePlayer();
    } else {
        if (p.turns_to_take < 0) {
            p.turns_to_take += 1;
            this.advanceActivePlayer();
        }
    }
}

Game.prototype.playCard = function(player, card) {
    var hand = this.players[player].hand;
    if (hand.includes(card)) {
        hand.splice(hand.indexOf(card), 1);
        this.discard.push(card);
        if (card == '5') this.bomb_timer += 5;
        if (card == '10') this.bomb_timer += 10;
        if (card == 'set0') this.bomb_timer = 0;
        if (card == 'set30') this.bomb_timer = 30;
        if (card == 'set60') this.bomb_timer = 50;
        if (card == 'skip') this.nextPlayerInCycle().turns_to_take -= 1;
        if (card == 'reverse') this.play_direction *= -1;
        if (this.bomb_timer > 60) {
            playerLooseLife(player);
            this.bomb_timer = 0;
        }
        if (hand.length == 0) {
            for (var p in this.players) {
                if (p != player) this.playerLooseLife(p);
            }
        }
        this.advanceActivePlayer();
    } else {
        console.warn('A player tried to play a card they did not have');
    }
};

module.exports = Game();
