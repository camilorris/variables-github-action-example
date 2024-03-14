export function green(msg) {
    return `\x1b[32m${msg}\x1b[0m`;
}
export function brightRed(msg) {
    return `\x1b[1;31m${msg}\x1b[0m`;
}
export function areSetsEqual(a, b) {
    return a.size === b.size && [...a].every((item) => b.has(item));
}
//# sourceMappingURL=utils.js.map