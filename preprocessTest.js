import { readFileSync } from "fs";
import { preprocess } from "svelte/compiler";
import preprocessor from "./preprocessor.js";

//get filename from command line
const filename = process.argv[2];

//read file
const file = readFileSync(filename, "utf8");

const usedExternal = new Set();
usedExternal.add("test");
usedExternal.add("items");
usedExternal.add("selectedItem");

//run svelte preprocess on it
const { code } = await preprocess(file, [preprocessor(usedExternal)]);

console.log("\n\nCode:", code);
