export interface LinkNode {
  kind: "link";
  label: string;
  href: string;
  description: string;
}

export interface GroupNode {
  kind: "group";
  label: string;
  description: string;
  href?: string;
  children: NavTreeNode[];
}

export type NavTreeNode = LinkNode | GroupNode;
