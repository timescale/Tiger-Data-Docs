"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@streamparser/json");
const utils_js_1 = require("./utils.js");
class TokenParserTransformer extends json_1.TokenParser {
    constructor(opts) {
        super(opts);
        this.onValue = (parsedElementInfo) => this.controller.enqueue((0, utils_js_1.cloneParsedElementInfo)(parsedElementInfo));
        this.onError = (err) => this.controller.error(err);
        this.onEnd = () => this.controller.terminate();
    }
    start(controller) {
        this.controller = controller;
    }
    transform(parsedTokenInfo) {
        this.write(parsedTokenInfo);
    }
    flush() {
        this.end();
    }
}
class TokenParserTransformStream extends TransformStream {
    constructor(opts, writableStrategy, readableStrategy) {
        const transformer = new TokenParserTransformer(opts);
        super(transformer, writableStrategy, readableStrategy);
    }
}
exports.default = TokenParserTransformStream;
//# sourceMappingURL=tokenparser.js.map