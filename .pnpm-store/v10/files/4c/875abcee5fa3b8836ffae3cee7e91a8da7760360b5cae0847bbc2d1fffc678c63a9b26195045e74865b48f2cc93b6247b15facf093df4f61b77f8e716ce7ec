"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneParsedElementInfo = void 0;
function cloneParsedElementInfo(parsedElementInfo) {
    const { value, key, parent, stack, partial } = parsedElementInfo;
    return { value, key, parent: clone(parent), stack: clone(stack), partial };
}
exports.cloneParsedElementInfo = cloneParsedElementInfo;
function clone(obj) {
    // Only objects are passed by reference and must be cloned
    if (typeof obj !== "object")
        return obj;
    // Solve arrays with empty positions
    if (Array.isArray(obj) && obj.filter((i) => i).length === 0)
        return obj;
    return JSON.parse(JSON.stringify(obj));
}
//# sourceMappingURL=utils.js.map