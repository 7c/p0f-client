"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseTimeout = promiseTimeout;
exports.wait = wait;
exports.arrayShuffle = arrayShuffle;
function promiseTimeout(ms, promise) {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((_, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('timedout');
        }, ms);
    });
    // Returns a race between our timeout and the passed in promise
    return Promise.race([
        promise,
        timeout
    ]);
}
function wait(seconds = 1) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, seconds * 1000);
    });
}
function arrayShuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
//# sourceMappingURL=tools.js.map