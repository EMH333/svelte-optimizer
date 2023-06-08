import { readFileSync } from "fs";
import { resolve } from "path";
import { cwd } from "process";
import { preprocess } from "svelte/compiler";
import preprocessor from "./preprocessor.js";
import { scanDir } from "./scan.js";

//get filename from command line
const filename = process.argv[2];

//read file
const file = readFileSync(filename, "utf8");

//get directory file is in
const dir = resolve(cwd(), filename).substring(0, resolve(cwd(), filename).lastIndexOf("/"));

const usedExternal = await scanDir(dir);

//run svelte preprocess on it
const { code } = await preprocess(file, [preprocessor(usedExternal)], { filename });

console.log("Used External:", usedExternal);
console.log("Code:");
console.log(code);
