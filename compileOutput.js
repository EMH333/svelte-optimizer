import { readFileSync } from "fs";
import { compile } from "svelte/compiler";

//get filename from command line
const filename = process.argv[2];

//read file
const file = readFileSync(filename, "utf8");

const output = compile(file);

console.log(output.js.code);
