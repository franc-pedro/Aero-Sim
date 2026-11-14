// Small deterministic PRNG so level layouts are reproducible across reloads.
export function createRng(seed) {
    let state = seed >>> 0;

    return function rng() {
        state += 0x6d2b79f5;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}
