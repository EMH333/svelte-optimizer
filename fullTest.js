import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import preprocess from "./preprocessor.js"
import path from "path";
import { readdir, stat } from 'fs/promises';
import fs from "fs";
import { scanDir } from "./scan.js";

const dirSize = async directory => {
    const files = await readdir(directory);
    const stats = files.map(file => stat(path.join(directory, file)));

    return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
}

// clear and recreate dist directory
if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
    fs.mkdirSync('dist');
} else {
    fs.mkdirSync('dist');
}

console.log("Building...");

const compare = process.argv.length >= 3 && process.argv[2] === "true";
let normalSize;

if (compare) {
    // normal build
    await esbuild
        .build({
            entryPoints: ["example-files/entry.js"],
            mainFields: ["svelte", "browser", "module", "main"],
            bundle: true,
            minify: true,
            pure: ["console.log"],
            format: "esm",
            target: "es2019",
            outdir: "./dist",
            plugins: [
                esbuildSvelte({
                    filterWarnings: (warning) => {
                        if (warning.code === "a11y-click-events-have-key-events") {
                            return false;
                        }
                        return true;
                    }
                }),
            ],
        })
        .catch(() => process.exit(1));

    normalSize = await dirSize("dist");
}

//const usedExternal = new Set();
//usedExternal.add("test");
//usedExternal.add("items");
//usedExternal.add("selectedItem");

const usedExternal = await scanDir("example-files");
console.log("Used external:", usedExternal);

await esbuild
    .build({
        entryPoints: ["example-files/entry.js"],
        mainFields: ["svelte", "browser", "module", "main"],
        bundle: true,
        minify: compare, // only minify if doing a comparison
        minifySyntax: true,
        pure: ["console.log"],
        format: "esm",
        target: "es2019",
        outdir: "./dist",
        plugins: [
            esbuildSvelte({
                preprocess: preprocess(usedExternal),
                filterWarnings: (warning) => {
                    if (warning.code === "a11y-click-events-have-key-events") {
                        return false;
                    }
                    return true;
                }
            }),
        ],
    })
    .catch(() => process.exit(1));

const preprocessedSize = await dirSize("dist");

compare && console.log("Normal size:", normalSize);
console.log("Preprocessed size:", preprocessedSize);
compare && console.log("Difference:", normalSize - preprocessedSize);
