import { defineConfig, mergeConfig } from "vitest/config";
import { nrg } from "@bonsae/nrg/test/server/integration/config";

export default mergeConfig(
  nrg,
  defineConfig({
    test: {
      include: ["tests/server/integration/**/*.test.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        reportsDirectory: "coverage/server/integration",
        include: ["src/server/**/*.ts"],
        exclude: ["src/server/schemas/**"],
      },
    },
  }),
);
