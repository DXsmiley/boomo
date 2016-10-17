module.exports = function(x, m) {
    while (x < 0) {
        x += m;
    }
    while (x >= m) {
        x -= m;
    }
    return x;
}
