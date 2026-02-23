"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tokenizer_js_1 = __importDefault(require("@streamparser/json/tokenizer.js"));
class TokenizerTransformer extends tokenizer_js_1.default {
    constructor(opts) {
        super(opts);
        this.onToken = (parsedTokenInfo) => this.controller.enqueue(parsedTokenInfo);
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
class TokenizerTransformStream extends TransformStream {
    constructor(opts, writableStrategy, readableStrategy) {
        const transformer = new TokenizerTransformer(opts);
        super(transformer, writableStrategy, readableStrategy);
    }
}
exports.default = TokenizerTransformStream;
//# sourceMappingURL=tokenizer.js.map