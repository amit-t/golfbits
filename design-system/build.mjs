#!/usr/bin/env node
// golfbits design system build: three outputs from one source tree.
//   dist/golfbits-ds.js      IIFE, global GolfbitsDS  (design-sync bundle source)
//   dist/golfbits-ds.esm.js  ESM                      (tests + tooling)
//   dist/golfbits-ds.css     flat stylesheet          (@imports inlined)
// react / react-dom are external — the design-sync runtime supplies them.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const r = (p) => resolve(root, p);

const shared = {
  bundle: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  jsx: "automatic",
  logLevel: "info",
};

async function run() {
  await build({
    ...shared,
    entryPoints: [r("src/index.js")],
    format: "iife",
    globalName: "GolfbitsDS",
    outfile: r("dist/golfbits-ds.js"),
  });

  await build({
    ...shared,
    entryPoints: [r("src/index.js")],
    format: "esm",
    outfile: r("dist/golfbits-ds.esm.js"),
  });

  // CSS: separate entry so @import "./tokens.css" is inlined into one flat file.
  await build({
    bundle: true,
    entryPoints: [r("src/styles.css")],
    outfile: r("dist/golfbits-ds.css"),
    logLevel: "info",
  });

  console.log("build ok → dist/golfbits-ds.{js,esm.js,css}");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
