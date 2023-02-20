import { scanDir } from "./scan.js";

//get dirname from command line
const dirname = process.argv[2];

const components = await scanDir(dirname);

console.log(JSON.stringify(components, null, 2));
