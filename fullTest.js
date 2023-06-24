import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import preprocess from "./preprocessor.js"
import path from "path";
import { readdir, stat } from 'fs/promises';
import fs from "fs";
import { scanDir } from "./scan.js";
import { gzipSync } from "zlib";

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
let normalSize, normalSizeGzip;

if (compare) {
    // normal build
    await esbuild
        .build({
            entryPoints: ["example-files/entry.js", "example-files/index.html"],
            mainFields: ["svelte", "browser", "module", "main"],
            bundle: true,
            minify: true,
            pure: ["console.log"],
            format: "esm",
            target: "es2019",
            outdir: "./dist",
            loader: {
                ".html": "copy",
            },
            plugins: [
                esbuildSvelte({
                    filterWarnings: (warning) => {
                        if (warning.code === "a11y-click-events-have-key-events" || warning.code === "a11y-no-static-element-interactions") {
                            return false;
                        }
                        return true;
                    }
                }),
            ],
        })
        .catch(() => process.exit(1));

    normalSize = await dirSize("dist");
    //gzip files in dist then measure size
    for(const file of fs.readdirSync("dist")) {
        const content = fs.readFileSync(`dist/${file}`);
        const gzipped = gzipSync(content, { level: 9 });
        fs.writeFileSync(`dist/${file}.gz`, gzipped);
    }
    normalSizeGzip = (await dirSize("dist")) - normalSize;

    // clear and recreate dist directory
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true });
        fs.mkdirSync('dist');
    }
}

//const usedExternal = new Set();
//usedExternal.add("test");
//usedExternal.add("items");
//usedExternal.add("selectedItem");

const usedExternal = await scanDir("example-files");
//console.log("Used external:", usedExternal);

await esbuild
    .build({
        entryPoints: ["example-files/entry.js", "example-files/index.html"],
        mainFields: ["svelte", "browser", "module", "main"],
        bundle: true,
        minify: compare, // only minify if doing a comparison
        minifySyntax: true,
        pure: ["console.log"],
        format: "esm",
        target: "es2019",
        outdir: "./dist",
        loader: {
            ".html": "copy",
        },
        plugins: [
            esbuildSvelte({
                preprocess: preprocess(usedExternal),
                filterWarnings: (warning) => {
                    if (warning.code === "a11y-click-events-have-key-events" || warning.code === "a11y-no-static-element-interactions") {
                        return false;
                    }
                    return true;
                }
            }),
        ],
    })
    .catch(() => process.exit(1));

const preprocessedSize = await dirSize("dist");
//gzip files in dist then measure size
for(const file of fs.readdirSync("dist")) {
    const content = fs.readFileSync(`dist/${file}`);
    const gzipped = gzipSync(content, { level: 9 });
    fs.writeFileSync(`dist/${file}.gz`, gzipped);
}
const preprocessedSizeGzip = (await dirSize("dist")) - preprocessedSize;

compare && console.log("Normal size:", normalSize);
compare && console.log("Normal size gzip:", normalSizeGzip);
console.log("Preprocessed size:", preprocessedSize);
console.log("Preprocessed size gzip:", preprocessedSizeGzip);
compare && console.log("Difference:", normalSize - preprocessedSize, `(${(preprocessedSize / normalSize * 100).toFixed(2)}%)`);
compare && console.log("Difference gzip:", normalSizeGzip - preprocessedSizeGzip, `(${(preprocessedSizeGzip / normalSizeGzip * 100).toFixed(2)}%)`);
