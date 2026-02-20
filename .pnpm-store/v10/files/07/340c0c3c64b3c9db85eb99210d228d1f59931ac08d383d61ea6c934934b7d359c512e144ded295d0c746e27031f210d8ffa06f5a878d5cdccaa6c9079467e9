import Tokenizer, {} from "@streamparser/json/tokenizer.js";
class TokenizerTransformer extends Tokenizer {
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
export default class TokenizerTransformStream extends TransformStream {
    constructor(opts, writableStrategy, readableStrategy) {
        const transformer = new TokenizerTransformer(opts);
        super(transformer, writableStrategy, readableStrategy);
    }
}
//# sourceMappingURL=tokenizer.js.map