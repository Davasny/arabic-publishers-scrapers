import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    maxConcurrency: 1,
    testTimeout: 30_000,
    minWorkers: 1,
    maxWorkers: 1,
  },
});
