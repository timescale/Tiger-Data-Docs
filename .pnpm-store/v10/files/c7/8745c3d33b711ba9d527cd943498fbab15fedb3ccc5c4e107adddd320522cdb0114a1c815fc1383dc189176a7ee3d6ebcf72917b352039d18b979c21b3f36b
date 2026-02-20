import Node from './node';
import Function from './function';
import Variable from './variable';
import type { AstType } from '../types';
declare function fromJSON(text: string): Node | Node[];
declare const _default: {
    fromJSON: typeof fromJSON;
    isAst(value?: any): value is AstType;
    isFunction(value?: any): value is Function;
    isVariable(value?: any): value is Variable;
    getAstValues(value: any): Generator<AstType, void, unknown>;
    resolve(value: any, config?: Readonly<Partial<{
        nodes: Partial<Record<import("../types").NodeType, import("../types").Schema<Partial<any>, string>>>;
        tags: Record<string, import("../types").Schema<Readonly<Partial<any>>, string>>;
        variables: Record<string, any>;
        functions: Record<string, import("../types").ConfigFunction>;
        partials: Record<string, any>;
        validation?: {
            parents?: Node[] | undefined;
            validateFunctions?: boolean | undefined;
            environment?: string | undefined;
        } | undefined;
    }>>): any;
    Function: typeof Function;
    Node: typeof Node;
    Variable: typeof Variable;
};
export default _default;
//# sourceMappingURL=index.d.ts.map