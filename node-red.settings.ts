import { defineNodeRedSettings } from "@bonsae/nrg/vite";

export default defineNodeRedSettings({
  uiPort: 1880,
  logging: {
    console: {
      level: "debug",
    },
  },
});
