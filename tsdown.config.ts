import { defineConfig, type UserConfig } from "tsdown";

const config: UserConfig = defineConfig({
  entry: ["src/index.ts", "src/icons/*.ts"],
  format: "esm",
  platform: "neutral",
  unbundle: true,
  dts: true,
});

export default config;
