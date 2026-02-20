"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@streamparser/json");
const utils_js_1 = require("./utils.js");
class JSONParserTransformer extends json_1.JSONParser {
    constructor(opts) {
        super(opts);
        this.onValue = (value) => this.controller.enqueue((0, utils_js_1.cloneParsedElementInfo)(value));
        this.onError = (err) => this.controller.error(err);
        this.onEnd = () => this.controller.terminate();
    }
    start(controller) {
        this.controller = controller;
    }
    transform(chunk) {
        this.write(chunk);
    }
    flush() {
        this.end();
    }
}
class JSONParserTransformStream extends TransformStream {
    constructor(opts, writableStrategy, readableStrategy) {
        const transformer = new JSONParserTransformer(opts);
        super(transformer, writableStrategy, readableStrategy);
    }
}
exports.default = JSONParserTransformStream;
//# sourceMappingURL=jsonparser.js.map