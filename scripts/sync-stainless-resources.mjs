// Adds/removes stainless.yml resource mappings to match openapi.yml; never renames an existing entry.

import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { parse, parseDocument } from "yaml";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

function snakeCase(segment) {
  return segment
    .replace(/-/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function splitPath(path) {
  return path.split("/").filter(Boolean);
}

function isParam(segment) {
  return segment.startsWith("{") && segment.endsWith("}");
}

function specEndpoints(openapi) {
  const endpoints = [];
  for (const [path, operations] of Object.entries(openapi.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      if (operations[method]) endpoints.push({ method, path });
    }
  }
  return endpoints;
}

function configEndpoints(resources) {
  const entries = [];
  function walk(node, keyPath) {
    for (const [name, value] of Object.entries(node.methods ?? {})) {
      const endpoint = typeof value === "string" ? value : value.endpoint;
      if (typeof endpoint !== "string" || !endpoint.includes(" ")) continue; // e.g. readme's $ref-shaped "endpoint" models entry
      const [method, path] = endpoint.split(" ");
      entries.push({ method, path, keyPath: [...keyPath, "methods", name] });
    }
    for (const [name, sub] of Object.entries(node.subresources ?? {})) {
      walk(sub, [...keyPath, "subresources", name]);
    }
  }
  for (const [name, resource] of Object.entries(resources)) {
    walk(resource, ["resources", name]);
  }
  return entries;
}

function displayPath(keyPath) {
  return keyPath.filter((t) => t !== "resources" && t !== "subresources" && t !== "methods").join(".");
}

// Resource nesting follows path segments; CRUD name at the collection/instance boundary, snake_case action name one segment past it.
function placeEndpoint({ method, path }, resources) {
  const segments = splitPath(path);
  let node = { subresources: resources };
  let keyPath = ["resources"];
  let i = 0;
  let lastWasId = false;

  while (i < segments.length && !isParam(segments[i])) {
    const key = snakeCase(segments[i]);
    const child = node.subresources?.[key];
    if (!child) break;
    node = child;
    keyPath = keyPath.length > 1 ? [...keyPath, "subresources", key] : [...keyPath, key];
    i += 1;
    lastWasId = false;
    if (i < segments.length && isParam(segments[i])) {
      i += 1;
      lastWasId = true;
    }
  }

  const tail = segments.slice(i);
  if (tail.length === 0) {
    const methodName =
      {
        "get:false": "list",
        "post:false": "create",
        "get:true": "retrieve",
        "put:true": "update",
        "patch:true": "update",
        "delete:true": "delete",
      }[`${method}:${lastWasId}`] ?? null;
    if (!methodName) {
      return {
        reason: `${method.toUpperCase()} ${path}: lands exactly on ${displayPath(keyPath) || "(root)"}'s ${lastWasId ? "instance" : "collection"} boundary, but ${method.toUpperCase()} there isn't one of the standard CRUD verbs`,
      };
    }
    return { keyPath: [...keyPath, "methods"], methodName };
  }

  if (tail.length === 1 && !isParam(tail[0])) {
    return { keyPath: [...keyPath, "methods"], methodName: snakeCase(tail[0]) };
  }

  return {
    reason: `${method.toUpperCase()} ${path}: ${tail.length} segment(s) (${tail.join("/")}) past ${displayPath(keyPath) || "(root)"} don't match the collection/instance/single-action shape this script knows how to name`,
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      openapi: { type: "string" },
      config: { type: "string" },
      report: { type: "string" },
    },
  });
  if (!values.openapi || !values.config || !values.report) {
    throw new Error("Usage: --openapi <path> --config <path> --report <path>");
  }

  const openapi = parse(await readFile(values.openapi, "utf8"));
  const configText = await readFile(values.config, "utf8");
  const doc = parseDocument(configText);
  const resources = doc.get("resources")?.toJS(doc) ?? {};

  const specKeys = new Set(specEndpoints(openapi).map((e) => `${e.method} ${e.path}`));
  const configured = configEndpoints(resources);
  const configuredKeys = new Set(configured.map((e) => `${e.method} ${e.path}`));

  const removed = [];
  const containersToPrune = new Set();
  for (const entry of configured) {
    if (!specKeys.has(`${entry.method} ${entry.path}`)) {
      doc.deleteIn(entry.keyPath);
      removed.push(entry);
      containersToPrune.add(JSON.stringify(entry.keyPath.slice(0, -2)));
    }
  }
  // Drop containers left with no methods/subresources (e.g. "analytics"), bubbling up but never touching the root.
  for (const key of containersToPrune) {
    let containerPath = JSON.parse(key);
    while (containerPath.length > 1) {
      const node = doc.getIn(containerPath);
      const methods = node?.get?.("methods");
      const subresources = node?.get?.("subresources");
      const methodsEmpty = !methods || methods.items.length === 0;
      const subresourcesEmpty = !subresources || subresources.items.length === 0;
      if (!methodsEmpty || !subresourcesEmpty) break;
      doc.deleteIn(containerPath);
      containerPath = containerPath.slice(0, -2);
    }
  }

  const added = [];
  const needsReview = [];
  for (const endpoint of specEndpoints(openapi)) {
    if (configuredKeys.has(`${endpoint.method} ${endpoint.path}`)) continue;
    const placement = placeEndpoint(endpoint, resources);
    if (placement.reason) {
      needsReview.push(placement.reason);
      continue;
    }
    const methodsPath = placement.keyPath;
    const existingMethods = doc.getIn(methodsPath)?.toJS(doc) ?? {};
    if (placement.methodName in existingMethods) {
      needsReview.push(
        `${endpoint.method.toUpperCase()} ${endpoint.path}: computed method name "${placement.methodName}" already exists at ${displayPath(methodsPath.slice(0, -1))}, needs a manual name`,
      );
      continue;
    }
    doc.setIn([...methodsPath, placement.methodName], `${endpoint.method} ${endpoint.path}`);
    added.push({ ...endpoint, keyPath: [...methodsPath, placement.methodName] });
  }

  if (added.length || removed.length) {
    // lineWidth: 0 avoids reflowing untouched lines when round-tripping through the Document API.
    await writeFile(values.config, doc.toString({ lineWidth: 0 }), "utf8");
  }

  const lines = ["### Stainless resource mapping", ""];
  if (!added.length && !removed.length && !needsReview.length) {
    lines.push("No `stainless/stainless.yml` changes needed for this spec update.");
  } else {
    if (added.length) {
      lines.push(`**Added (${added.length})**`, "");
      for (const e of added) lines.push(`- \`${displayPath(e.keyPath)}\`: ${e.method.toUpperCase()} ${e.path}`);
      lines.push("");
    }
    if (removed.length) {
      lines.push(`**Removed, no longer in the spec (${removed.length})**`, "");
      for (const e of removed) lines.push(`- \`${displayPath(e.keyPath)}\`: ${e.method.toUpperCase()} ${e.path}`);
      lines.push("");
    }
    if (needsReview.length) {
      lines.push(`**Needs manual placement in \`stainless.yml\` (${needsReview.length})**`, "");
      for (const r of needsReview) lines.push(`- ${r}`);
      lines.push("");
    }
  }
  await writeFile(values.report, lines.join("\n"), "utf8");

  console.log(lines.join("\n"));
  console.log(`NEEDS_REVIEW=${needsReview.length > 0}`);
}

await main();
