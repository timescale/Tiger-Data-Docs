/**
 * Unwrap a file value from a union type, like the build object's `documented_spec`.
 *
 * @example
 *   const build = await client.builds.retrieve(buildID);
 *   const spec = await Stainless.unwrapFile(build.documented_spec);
 */
export async function unwrapFile(
  value: { type: 'content'; content: string } | { type: 'url'; url: string },
): Promise<string>;
export async function unwrapFile(
  value: { type: 'content'; content: string } | { type: 'url'; url: string } | null,
): Promise<string | null>;
export async function unwrapFile(
  value: { type: 'content'; content: string } | { type: 'url'; url: string } | null,
): Promise<string | null> {
  if (value === null) {
    return null;
  }
  if (value.type === 'content') {
    return value.content;
  }
  const response = await fetch(value.url);
  return response.text();
}
