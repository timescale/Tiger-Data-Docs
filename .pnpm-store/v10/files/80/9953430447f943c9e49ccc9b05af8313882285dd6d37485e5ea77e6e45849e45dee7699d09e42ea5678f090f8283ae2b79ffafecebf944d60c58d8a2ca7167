import { JSONParser } from "@streamparser/json";
import { cloneParsedElementInfo } from "./utils.js";
class JSONParserTransformer extends JSONParser {
    constructor(opts) {
        super(opts);
        this.onValue = (value) => this.controller.enqueue(cloneParsedElementInfo(value));
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
export default class JSONParserTransformStream extends TransformStream {
    constructor(opts, writableStrategy, readableStrategy) {
        const transformer = new JSONParserTransformer(opts);
        super(transformer, writableStrategy, readableStrategy);
    }
}
//# sourceMappingURL=jsonparser.js.map