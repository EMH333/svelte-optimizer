import { scanDir } from "./scan.js";

//get dirname from command line
const dirname = process.argv[2];

const components = await scanDir(dirname);

console.log(JSON.stringify(components, null, 2));

//TODO fix getting import paths for components, currently only works for relative files
//put in location and format that the preprocessing script can deal with
