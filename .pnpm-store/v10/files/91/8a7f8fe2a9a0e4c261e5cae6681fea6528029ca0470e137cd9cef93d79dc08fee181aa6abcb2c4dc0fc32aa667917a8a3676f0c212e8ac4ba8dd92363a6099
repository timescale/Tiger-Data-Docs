import { TokenParser } from "@streamparser/json";
import { cloneParsedElementInfo } from "./utils.js";
class TokenParserTransformer extends TokenParser {
    constructor(opts) {
        super(opts);
        this.onValue = (parsedElementInfo) => this.controller.enqueue(cloneParsedElementInfo(parsedElementInfo));
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
export default class TokenParserTransformStream extends TransformStream {
    constructor(opts, writableStrategy, readableStrategy) {
        const transformer = new TokenParserTransformer(opts);
        super(transformer, writableStrategy, readableStrategy);
    }
}
//# sourceMappingURL=tokenparser.js.map