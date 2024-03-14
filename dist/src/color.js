var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
export function colorApproximatelyEqual(colorA, colorB) {
    return rgbToHex(colorA) === rgbToHex(colorB);
}
export function parseColor(color) {
    color = color.trim();
    const hexRegex = /^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2}){0,1}$/;
    const hexShorthandRegex = /^#([A-Fa-f0-9]{3})([A-Fa-f0-9]){0,1}$/;
    if (hexRegex.test(color) || hexShorthandRegex.test(color)) {
        const hexValue = color.substring(1);
        const expandedHex = hexValue.length === 3 || hexValue.length === 4
            ? hexValue
                .split('')
                .map((char) => char + char)
                .join('')
            : hexValue;
        const alphaValue = expandedHex.length === 8 ? expandedHex.slice(6, 8) : undefined;
        return Object.assign({ r: parseInt(expandedHex.slice(0, 2), 16) / 255, g: parseInt(expandedHex.slice(2, 4), 16) / 255, b: parseInt(expandedHex.slice(4, 6), 16) / 255 }, (alphaValue ? { a: parseInt(alphaValue, 16) / 255 } : {}));
    }
    else {
        throw new Error('Invalid color format');
    }
}
export function rgbToHex(_a) {
    var { r, g, b } = _a, rest = __rest(_a, ["r", "g", "b"]);
    const a = 'a' in rest ? rest.a : 1;
    const toHex = (value) => {
        const hex = Math.round(value * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    const hex = [toHex(r), toHex(g), toHex(b)].join('');
    return `#${hex}` + (a !== 1 ? toHex(a) : '');
}
//# sourceMappingURL=color.js.map