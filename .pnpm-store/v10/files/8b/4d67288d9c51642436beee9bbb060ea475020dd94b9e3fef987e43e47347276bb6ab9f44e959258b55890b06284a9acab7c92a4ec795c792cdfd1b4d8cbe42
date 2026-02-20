import type { RenderableTreeNode } from './types';
export default class Tag<N extends string = string, A extends Record<string, any> = Record<string, any>> {
    readonly $$mdtype: "Tag";
    static isTag: (tag: any) => tag is Tag<string, Record<string, any>>;
    name: N;
    attributes: A;
    children: RenderableTreeNode[];
    constructor(name?: N, attributes?: A, children?: RenderableTreeNode[]);
}
//# sourceMappingURL=tag.d.ts.map