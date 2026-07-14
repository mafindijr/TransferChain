import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  outExtension({ format }) {
    if (format === "esm") return { js: ".mjs", dts: ".d.mts" };
    return { js: ".cjs", dts: ".d.cts" };
  },
});
