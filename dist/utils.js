"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomIntInclusive = getRandomIntInclusive;
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}
//# sourceMappingURL=utils.js.map