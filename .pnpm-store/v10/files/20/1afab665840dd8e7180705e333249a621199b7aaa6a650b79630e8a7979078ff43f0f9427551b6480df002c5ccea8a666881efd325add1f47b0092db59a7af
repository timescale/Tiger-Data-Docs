import type { Node, Config, SchemaAttribute, ValidationError, Value } from './types';
declare type TypeParam = NonNullable<SchemaAttribute['type']>;
export declare function validateType(type: TypeParam, value: Value, config: Config, key: string): boolean | ValidationError[];
export default function validator(node: Node, config: Config): ValidationError[] | Promise<ValidationError[]>;
export declare function walkWithParents(node: Node, parents?: Node[]): Generator<[Node, Node[]]>;
export declare function validateTree(content: Node, config: Config): Promise<({
    type: import("./types").NodeType;
    lines: number[];
    location: import("./types").Location | undefined;
    error: ValidationError;
} | {
    type: import("./types").NodeType;
    lines: number[];
    location: import("./types").Location | undefined;
    error: ValidationError;
})[]> | (Promise<{
    type: import("./types").NodeType;
    lines: number[];
    location: import("./types").Location | undefined;
    error: ValidationError;
}[]> | {
    type: import("./types").NodeType;
    lines: number[];
    location: import("./types").Location | undefined;
    error: ValidationError;
})[];
export {};
//# sourceMappingURL=validator.d.ts.map