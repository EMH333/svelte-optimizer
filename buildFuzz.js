import { build } from "esbuild";

build({
    entryPoints: ["preprocessor.js"],
    bundle: false,
    format: "cjs",
    outfile: "fuzzDist/preprocessor.cjs",
    platform: "node",
    target: "node20",
}).catch(() => process.exit(1));
