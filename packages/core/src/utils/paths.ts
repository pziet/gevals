import { resolve, dirname } from "path"; // path utilities
import { fileURLToPath } from "url"; // ESM path helper
import { existsSync } from "fs"; // file existence check

// Get the workspace root directory
export function getWorkspaceRoot(): string {
  // Get the directory of the current file using ES modules approach
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // In a Turborepo monorepo, we can find the root by looking for the root package.json
  let currentDir = __dirname;
  while (currentDir !== "/") {
    if (existsSync(resolve(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir; // found root
    }
    currentDir = resolve(currentDir, "..");
  }
  throw new Error("Could not find workspace root");
}

// Get absolute path relative to workspace root
export function getWorkspacePath(relativePath: string): string {
  return resolve(getWorkspaceRoot(), relativePath); // resolve relative path
}
