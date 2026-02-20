/**
 * Technical overview:
 * - `StainlessIslands.ts` is an Astro Client Island wherein we register a HTML custom element called `stl-island`
 *     - When a `<stl-island component="MyComponent">` is added to the DOM, we:
 *         1. receive a callback from the browser
 *         2. dynamic-import `MyComponent`
 *         3. create an instance of `MyComponent`, to which we pass the **`stl-island` DOM node** as a prop named `parent`
 *         4. register the (`stlIslandDomNode` → `ReactNode`) pair in a global map named `roots`
 *     - The actual Astro client island is a simple React component that renders all of the ReactNodes from the global `roots` map
 *         - it uses a `useSyncExternalStore` to be notified of changes to the global `roots` map by registering a callback
 *     - Each “stainless island” (instantiated by the custom element handler and rendered by the Astro client island) is responsible for using the `parent` prop it receives to identify one or more **portal targets** into which it can render its contents.
 *         - the react parent of all Stainless Islands is the global `<StainlessIslands client:load />` singleton, but the _DOM parent_ is the various portal targets of all of the stainless islands
 */

import { useSyncExternalStore, ReactNode } from 'react';

type StlIslandComponent = ({ parent }: { parent: HTMLElement }) => ReactNode;

/**
 * Register new Stainless Islands in this map.
 * The component should be the default export and should be able to be dynamic-imported.
 * The component should accept a single prop: `parent: HTMLElement`, which is the DOM node of the `<stl-island>` element.
 * The component can create portals to render into the DOM subtree of the `parent`.
 */
const componentsMap: Record<string, () => Promise<{ default: StlIslandComponent }>> = {
  SnippetStainlessIsland: () => import('./RequestBuilder/SnippetStainlessIsland'),
};

interface State {
  roots: Map<HTMLElement, ReactNode>;
  onRootsChange?: (() => void) | undefined;
}

// keep state in import.meta.hot.data so that our record of our react roots is not lost across HMR
const state: State = import.meta.hot?.data?.state ?? {
  roots: new Map(),
};

if (import.meta.hot?.data) {
  import.meta.hot.data.state = state;
}

let key = 0;

/**
 * Custom element mounts and unmounts components and gives them a reference to the parent
 * so they can render in portals.
 */
class StlIsland extends (globalThis?.HTMLElement ?? Object) {
  connectedCallback(this: StlIsland) {
    const componentName = this.getAttribute('component');
    if (!componentName) {
      console.error('[stl-island] missing required attribute "component"');
      return;
    }

    if (!componentsMap[componentName]) {
      console.error(`[stl-island] unknown component "${componentName}"`);
      return;
    }

    componentsMap[componentName]().then(
      ({ default: Component }) => {
        state.roots = new Map(state.roots).set(this, <Component parent={this} key={key++} />);
        state.onRootsChange?.();
      },
      (e) => {
        console.error(`[stl-island] failed to load component "${componentName}":`, e);
      },
    );
  }
  connectedMoveCallback() {
    // empty so we don't get disconnected/reconnected if the dom element gets moved
  }
  disconnectedCallback() {
    state.roots = new Map(state.roots);
    state.roots.delete(this);
    state.onRootsChange?.();
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('stl-island')) {
  customElements.define('stl-island', StlIsland);
}

declare global {
  interface HTMLElementTagNameMap {
    'stl-island': StlIsland;
  }
}
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      // client-loaded
      'stl-island': React.DetailedHTMLProps<React.HTMLAttributes<StlIsland>, StlIsland> & {
        component: keyof typeof componentsMap;
      };
    }
  }
}

/** Renders all StainlessIslands that have been registered in the global `state.roots` map */
function StainlessIslandsInner() {
  const roots = useSyncExternalStore<Map<HTMLElement, ReactNode> | null>(
    (onChange) => {
      state.onRootsChange = onChange;
      return () => {
        state.onRootsChange = undefined;
      };
    },
    () => {
      return state.roots;
    },
    () => null,
  );
  if (!roots) return null;
  return [...roots.values()];
}

export function StainlessIslands() {
  // Astro tries to call this function outside of react to detect if it's
  // an Astro JSX or React JSX component, which causes warnings if we use hooks,
  // so we use a wrapper component to avoid the hook calls.
  return <StainlessIslandsInner />;
}
