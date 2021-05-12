import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import css from "rollup-plugin-css-only";
import autoPreprocess from "svelte-preprocess";

export default {
  input: "public/svelte/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/compiled/bundle.js",
  },
  plugins: [
    svelte({
      preprocess: autoPreprocess(),
    }),
    css({ output: "bundle.css" }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),
  ],
};
