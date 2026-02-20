import type { AstType, AttributeValue, Config, Location, MaybePromise, NodeType, RenderableTreeNode, RenderableTreeNodes, Schema, ValidationError } from '../types';
export default class Node implements AstType {
    readonly $$mdtype = "Node";
    attributes: Record<string, any>;
    slots: Record<string, Node>;
    children: Node[];
    errors: ValidationError[];
    lines: number[];
    type: NodeType;
    tag?: string;
    annotations: AttributeValue[];
    inline: boolean;
    location?: Location;
    constructor(type?: NodeType, attributes?: Record<string, any>, children?: Node[], tag?: string);
    walk(): Generator<Node, void, unknown>;
    push(node: Node): void;
    resolve(config?: Config): Node;
    findSchema(config?: Config): Schema | undefined;
    transformAttributes(config?: Config): Record<string, any>;
    transformChildren(config: Config): RenderableTreeNode[];
    transform(config: Config): MaybePromise<RenderableTreeNodes>;
}
//# sourceMappingURL=node.d.ts.map