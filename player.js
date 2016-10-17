function Player(id, name) {
    this.name = name;
    this.id = id;
    this.active = true;
    this.connected = true;
    this.reset();
    this.in_game = false;
}

Player.prototype.reset = function() {
    this.hand = [];
    this.lives = 3;
    this.turns_to_take = 0;
    this.order = {
        next: undefined,
        prev: undefined
    };
};

Player.prototype.setOrder = function(prev, next) {
    this.order = {
        prev: prev,
        next: next
    };
    console.log(prev.name, '->', this.name, '->', next.name);
};

module.exports = Player;
