import type Func from './ast/function';
import type Node from './ast/node';
import type Var from './ast/variable';
import type Tag from './tag';
export type { Node, Tag };
export declare type Function = Func;
export declare type Variable = Var;
export declare type MaybePromise<T> = T | Promise<T>;
export interface AstType {
    readonly $$mdtype: 'Function' | 'Node' | 'Variable';
    resolve(config: Config): any;
}
export declare type AttributeValue = {
    type: string;
    name: string;
    value: any;
};
export declare type Config<R = string> = Readonly<ConfigType<R>>;
export declare type ConfigType<R = string> = Partial<{
    nodes: Partial<Record<NodeType, Schema<ConfigType, R>>>;
    tags: Record<string, Schema>;
    variables: Record<string, any>;
    functions: Record<string, ConfigFunction>;
    partials: Record<string, any>;
    validation?: {
        parents?: Node[];
        validateFunctions?: boolean;
        environment?: string;
    };
}>;
export declare type ConfigFunction = {
    returns?: ValidationType | ValidationType[];
    parameters?: Record<string, SchemaAttribute>;
    transform?(parameters: Record<string, any>, config: Config): any;
    validate?(fn: Func, config: Config): ValidationError[];
};
export interface CustomAttributeTypeInterface {
    transform?(value: any, config: Config): Scalar;
    validate?(value: any, config: Config, name: string): ValidationError[];
}
export interface CustomAttributeType {
    new (): CustomAttributeTypeInterface;
    readonly prototype: CustomAttributeTypeInterface;
}
export declare type Location = {
    file?: string;
    start: LocationEdge;
    end: LocationEdge;
};
export declare type LocationEdge = {
    line: number;
    character?: number;
};
export declare type NodeType = 'blockquote' | 'code' | 'comment' | 'document' | 'em' | 'error' | 'fence' | 'hardbreak' | 'heading' | 'hr' | 'image' | 'inline' | 'item' | 'link' | 'list' | 'node' | 'paragraph' | 's' | 'softbreak' | 'strong' | 'table' | 'tag' | 'tbody' | 'td' | 'text' | 'th' | 'thead' | 'tr';
export declare type Primitive = null | boolean | number | string;
export declare type RenderableTreeNode = Tag | Scalar;
export declare type RenderableTreeNodes = RenderableTreeNode | RenderableTreeNode[];
export declare type Scalar = Primitive | Scalar[] | {
    [key: string]: Scalar;
};
export declare type Schema<C extends Config = Config, R = string> = {
    render?: R;
    children?: string[];
    attributes?: Record<string, SchemaAttribute>;
    slots?: Record<string, SchemaSlot>;
    selfClosing?: boolean;
    inline?: boolean;
    transform?(node: Node, config: C): MaybePromise<RenderableTreeNodes>;
    validate?(node: Node, config: C): MaybePromise<ValidationError[]>;
    description?: string;
};
export declare type SchemaAttribute = {
    type?: ValidationType | ValidationType[];
    render?: boolean | string;
    default?: any;
    required?: boolean;
    matches?: SchemaMatches | ((config: Config) => SchemaMatches);
    validate?(value: any, config: Config, name: string): ValidationError[];
    errorLevel?: ValidationError['level'];
    description?: string;
};
export declare type SchemaMatches = RegExp | string[] | null;
export declare type SchemaSlot = {
    render?: boolean | string;
    required?: boolean;
};
export interface Transformer {
    findSchema(node: Node, config: Config): Schema | undefined;
    node(node: Node, config: Config): MaybePromise<RenderableTreeNodes>;
    attributes(node: Node, config: Config): Record<string, any>;
    children(node: Node, config: Config): RenderableTreeNode[];
}
export declare type ValidationError = {
    id: string;
    level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
    message: string;
    location?: Location;
};
export declare type ValidateError = {
    type: string;
    lines: number[];
    location?: Location;
    error: ValidationError;
};
export declare type ValidationType = CustomAttributeType | typeof String | typeof Number | typeof Boolean | typeof Object | typeof Array | 'String' | 'Number' | 'Boolean' | 'Object' | 'Array';
export declare type Value = AstType | Scalar;
export declare type ParserArgs = {
    file?: string;
    slots?: boolean;
    location?: boolean;
};
//# sourceMappingURL=types.d.ts.map