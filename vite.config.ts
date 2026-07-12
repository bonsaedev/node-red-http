import { defineConfig } from "vite";
import { nrg } from "@bonsae/nrg/vite";

export default defineConfig({
  plugins: [
    nrg({
      server: {
        nodeRed: {
          runtime: {
            settingsFilepath: "./node-red.settings.ts",
          },
        },
      },
    }),
  ],
});
