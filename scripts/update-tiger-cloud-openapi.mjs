import { readFile, writeFile } from "node:fs/promises";
import { parse } from "yaml";

const source =
  "https://raw.githubusercontent.com/stainless-sdks/tiger-cloud-openapi/main/openapi.yml";
const destination = new URL("../stainless/openapi.yml", import.meta.url);

const response = await fetch(source);
if (!response.ok) {
  throw new Error(
    `Could not download the Tiger Cloud OpenAPI document (${response.status}).`,
  );
}

const contents = await response.text();
const document = parse(contents);
if (
  document?.openapi !== "3.0.3" ||
  document?.info?.title !== "Tiger Cloud API" ||
  !document?.paths
) {
  throw new Error(
    "Downloaded file is not the expected Tiger Cloud OpenAPI document.",
  );
}

const previous = await readFile(destination, "utf8").catch(() => "");
if (previous === contents) {
  console.log("Tiger Cloud OpenAPI document is already current.");
} else {
  await writeFile(destination, contents, "utf8");
  console.log(
    "Updated stainless/openapi.yml. Review the diff, then run pnpm build.",
  );
}
