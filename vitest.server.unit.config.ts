import { defineConfig, mergeConfig } from "vitest/config";
import { nrg } from "@bonsae/nrg/test/server/unit/config";

export default mergeConfig(
  nrg,
  defineConfig({
    test: {
      include: ["tests/server/unit/**/*.test.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        include: ["src/server/**/*.ts"],
        exclude: ["src/server/schemas/**"],
      },
    },
  }),
);
