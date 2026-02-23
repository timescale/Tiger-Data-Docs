// src/tag.ts
var Tag = class {
  constructor(name = "div", attributes = {}, children = []) {
    this.$$mdtype = "Tag";
    this.name = name;
    this.attributes = attributes;
    this.children = children;
  }
};
Tag.isTag = (tag) => {
  return !!(tag?.$$mdtype === "Tag");
};

// src/renderers/react/react.ts
function tagName(name, components) {
  return typeof name !== "string" ? name : name[0] !== name[0].toUpperCase() ? name : components instanceof Function ? components(name) : components[name];
}
function dynamic(node, React, { components = {}, resolveTagName = tagName } = {}) {
  function deepRender(value) {
    if (value == null || typeof value !== "object")
      return value;
    if (Array.isArray(value))
      return value.map((item) => deepRender(item));
    if (value.$$mdtype === "Tag")
      return render(value);
    if (typeof value !== "object")
      return value;
    const output = {};
    for (const [k, v] of Object.entries(value))
      output[k] = deepRender(v);
    return output;
  }
  function render(node2) {
    if (Array.isArray(node2))
      return React.createElement(React.Fragment, null, ...node2.map(render));
    if (node2 === null || typeof node2 !== "object" || !Tag.isTag(node2))
      return node2;
    const {
      name,
      attributes: { class: className, ...attrs } = {},
      children = []
    } = node2;
    if (className)
      attrs.className = className;
    return React.createElement(resolveTagName(name, components), Object.keys(attrs).length == 0 ? null : deepRender(attrs), ...children.map(render));
  }
  return render(node);
}
export {
  dynamic as default
};
