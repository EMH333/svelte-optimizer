import { readFileSync } from "fs";

//get filename from command line
const filename = process.argv[2];

//read file
const file = readFileSync(filename, "utf8");

// search for import statements
const imports = file.match(/import\s+.*\s+from\s+["'].*["']/g);

//console.log("Imports:", imports);

let componentNames = [];

for (const imp of imports) {
    // get file being imported from in js
    const importFile = imp.match(/["'].*["']/)[0].replace(/["']/g, "");
    if (importFile.endsWith(".svelte")) {
        //get component name from import statement
        const componentName = imp.match(/import\s+.*\s+from/)[0].replace(/import\s+|\s+from/g, "");
        componentNames.push(componentName);
    }
}

//console.log("Component Names:", componentNames);

for (const comp of componentNames) {
    const instances = file.match(new RegExp(`<\s*${comp}.*?\/>`, "gs"));

    //extract properties set on component
    //TODO use AST from svelte to get all properties (and potentially custom elements)
    const props = instances.map(inst => {
        const props = [...inst.matchAll(/(\w+)\s*?=\s*?{/g)];
        return props.map(m => m[1]);
    }).flat();

    // dedupe props
    const uniqueProps = [...new Set(props)];

    console.log(comp, uniqueProps);
}


