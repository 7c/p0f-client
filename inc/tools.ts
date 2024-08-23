export function promiseTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise<never>((_, reject) => {
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





export function wait(seconds = 1): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, seconds * 1000)
    })
}


export function arrayShuffle<T>(a: T[]): T[] {
    let j: number, x: T, i: number;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}