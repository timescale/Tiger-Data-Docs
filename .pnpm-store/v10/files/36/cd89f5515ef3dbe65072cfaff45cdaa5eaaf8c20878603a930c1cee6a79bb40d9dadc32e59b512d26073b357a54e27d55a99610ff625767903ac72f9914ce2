import { join } from 'path';
const dirName = import.meta.dirname;
/**
 * Resolve a source file path relative to the stl-starlight package.
 * @param projectPath - The relative path to the source file.
 * @returns The absolute path to the source file.
 */
export function resolveSrcFile(...projectPath: string[]) {
  return join(dirName, ...projectPath);
}
