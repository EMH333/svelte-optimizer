import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import preprocess from "./preprocessor.js"
import path from "path";
import { readdir, stat } from 'fs/promises';
import fs from "fs";

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

// normal build
await esbuild
    .build({
        entryPoints: ["example-files/entry.js"],
        mainFields: ["svelte", "browser", "module", "main"],
        bundle: true,
        minify: true,
        outdir: "./dist",
        plugins: [
            esbuildSvelte({}),
        ],
    })
    .catch(() => process.exit(1));

const normalSize = await dirSize("dist");

const usedExternal = new Set();
usedExternal.add("test");
usedExternal.add("items");
usedExternal.add("selectedItem");


await esbuild
    .build({
        entryPoints: ["example-files/entry.js"],
        mainFields: ["svelte", "browser", "module", "main"],
        bundle: true,
        minify: true,
        outdir: "./dist",
        plugins: [
            esbuildSvelte({
                preprocess: preprocess(usedExternal),
            }),
        ],
    })
    .catch(() => process.exit(1));

const preprocessedSize = await dirSize("dist");

console.log("Normal size:", normalSize);
console.log("Preprocessed size:", preprocessedSize);
console.log("Difference:", normalSize - preprocessedSize);
