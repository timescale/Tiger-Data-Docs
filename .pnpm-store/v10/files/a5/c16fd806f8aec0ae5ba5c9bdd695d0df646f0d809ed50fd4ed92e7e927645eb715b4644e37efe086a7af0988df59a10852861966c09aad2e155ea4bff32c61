import Ast from './src/ast';
import Node from './src/ast/node';
import format from './src/formatter';
import functions from './src/functions';
import * as nodes from './src/schema';
import renderers from './src/renderers';
import Tag from './src/tag';
import tags from './src/tags';
import { truthy } from './src/tags/conditional';
import Tokenizer from './src/tokenizer';
import transformer, { globalAttributes } from './src/transformer';
import transforms from './src/transforms';
import { parseTags } from './src/utils';
import validator from './src/validator';
import type { ParserArgs } from './src/types';
import type Token from 'markdown-it/lib/token';
import type { Config, RenderableTreeNode, ValidateError } from './src/types';
export * from './src/types';
export declare function parse(content: string | Token[], args?: string | ParserArgs): Node;
export declare function resolve<C extends Config = Config>(content: Node, config: C): Node;
export declare function resolve<C extends Config = Config>(content: Node[], config: C): Node[];
export declare function transform<C extends Config = Config>(node: Node, config?: C): RenderableTreeNode;
export declare function transform<C extends Config = Config>(nodes: Node[], config?: C): RenderableTreeNode[];
export declare function validate<C extends Config = Config>(node: Node, options?: C): ValidateError[];
export declare function createElement(name: string | {
    key?: string | number;
}, attributes?: {}, ...children: any[]): {
    name: string | {
        key?: string | number | undefined;
    };
    attributes: {};
    children: any[];
};
export { nodes, tags, functions, globalAttributes, transforms, renderers, Ast, Node, Tag, Tokenizer, parseTags, transformer, validator, truthy, format, };
export default class Markdoc {
    static nodes: typeof nodes;
    static tags: {
        else: import("./src/types").Schema<Readonly<Partial<{
            nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
            tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
            variables: Record<string, any>;
            functions: Record<string, import("./src/types").ConfigFunction>;
            partials: Record<string, any>;
            validation?: {
                parents?: Node[] | undefined;
                validateFunctions?: boolean | undefined;
                environment?: string | undefined;
            } | undefined;
        }>>, string>;
        if: import("./src/types").Schema<Readonly<Partial<{
            nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
            tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
            variables: Record<string, any>;
            functions: Record<string, import("./src/types").ConfigFunction>;
            partials: Record<string, any>;
            validation?: {
                parents?: Node[] | undefined;
                validateFunctions?: boolean | undefined;
                environment?: string | undefined;
            } | undefined;
        }>>, string>;
        partial: import("./src/types").Schema<Readonly<Partial<{
            nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
            tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
            variables: Record<string, any>;
            functions: Record<string, import("./src/types").ConfigFunction>;
            partials: Record<string, any>;
            validation?: {
                parents?: Node[] | undefined;
                validateFunctions?: boolean | undefined;
                environment?: string | undefined;
            } | undefined;
        }>>, string>;
        slot: import("./src/types").Schema<Readonly<Partial<{
            nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
            tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
            variables: Record<string, any>;
            functions: Record<string, import("./src/types").ConfigFunction>;
            partials: Record<string, any>;
            validation?: {
                parents?: Node[] | undefined;
                validateFunctions?: boolean | undefined;
                environment?: string | undefined;
            } | undefined;
        }>>, string>;
        table: import("./src/types").Schema<Readonly<Partial<{
            nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
            tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
            variables: Record<string, any>;
            functions: Record<string, import("./src/types").ConfigFunction>;
            partials: Record<string, any>;
            validation?: {
                parents?: Node[] | undefined;
                validateFunctions?: boolean | undefined;
                environment?: string | undefined;
            } | undefined;
        }>>, string>;
    };
    static functions: {
        and: import("./src/types").ConfigFunction;
        or: import("./src/types").ConfigFunction;
        not: import("./src/types").ConfigFunction;
        equals: import("./src/types").ConfigFunction;
        default: import("./src/types").ConfigFunction;
        debug: import("./src/types").ConfigFunction;
    };
    static globalAttributes: Record<string, import("./src/types").SchemaAttribute> | undefined;
    static renderers: {
        html: typeof import("./src/renderers/html").default;
        react: typeof import("./src/renderers/react/react").default;
        reactStatic: typeof import("./src/renderers/react/static").default;
    };
    static transforms: typeof import("./src/transforms/table").default[];
    static Ast: {
        fromJSON: (text: string) => Node | Node[];
        isAst(value?: any): value is import("./src/types").AstType;
        isFunction(value?: any): value is import("./src/ast/function").default;
        isVariable(value?: any): value is import("./src/ast/variable").default;
        getAstValues(value: any): Generator<import("./src/types").AstType, void, unknown>;
        resolve(value: any, config?: Readonly<Partial<{
            nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
            tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
            variables: Record<string, any>;
            functions: Record<string, import("./src/types").ConfigFunction>;
            partials: Record<string, any>;
            validation?: {
                parents?: Node[] | undefined;
                validateFunctions?: boolean | undefined;
                environment?: string | undefined;
            } | undefined;
        }>>): any;
        Function: typeof import("./src/ast/function").default;
        Node: typeof Node;
        Variable: typeof import("./src/ast/variable").default;
    };
    static Tag: typeof Tag;
    static Tokenizer: typeof Tokenizer;
    static parseTags: typeof parseTags;
    static transformer: import("./src/types").Transformer;
    static validator: typeof validator;
    static parse: typeof parse;
    static transform: typeof transform;
    static validate: typeof validate;
    static createElement: typeof createElement;
    static truthy: typeof truthy;
    static format: typeof format;
    config: Readonly<Partial<{
        nodes: Partial<Record<import("./src/types").NodeType, import("./src/types").Schema<Partial<any>, string>>>;
        tags: Record<string, import("./src/types").Schema<Readonly<Partial<any>>, string>>;
        variables: Record<string, any>;
        functions: Record<string, import("./src/types").ConfigFunction>;
        partials: Record<string, any>;
        validation?: {
            parents?: Node[] | undefined;
            validateFunctions?: boolean | undefined;
            environment?: string | undefined;
        } | undefined;
    }>>;
    constructor(config: Config);
    parse: typeof parse;
    resolve: (content: Parameters<typeof resolve>[0]) => Node[];
    transform: (content: Parameters<typeof transform>[0]) => RenderableTreeNode[];
    validate: (content: Parameters<typeof validate>[0]) => ValidateError[];
}
//# sourceMappingURL=index.d.ts.map