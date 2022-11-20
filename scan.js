import { readFileSync } from "fs";
import path from "path";
import { compile } from "svelte/compiler";

//get filename from command line
const filename = process.argv[2];

//read file
const file = readFileSync(filename, "utf8");

const { ast } = compile(file, {
    filename,
    generate: false,
});


let components = [];

function walkNode(node) {
    if (node.type === "InlineComponent") {
        let component = {
            name: node.name,
            attributes: [],
        };
        if (node.attributes) {
            for (let j = 0; j < node.attributes.length; j++) {
                const attribute = node.attributes[j];
                //TODO might need to alert if certian attributes are used because it makes it impossible to tell what vars are actually used
                component.attributes.push(attribute.name);
            }
        }
        components.push(component);
    }

    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            walkNode(child);
        }
    }
}

walkNode(ast.html);
//console.log(JSON.stringify(components, null, 2));
for(let i = 0; i < components.length; i++){
    const component = components[i];
    // find import for component.name
    const importStatement = file.match(new RegExp(`import\\s+${component.name}\\s+from\\s+['"](.+)['"]`));
    if(importStatement){
        const importPath = importStatement[1];
        const absolutePath = await import.meta.resolve(importPath, "file://"+path.resolve(filename));
        console.log(absolutePath);
        components[i].importPath = absolutePath;
    }
}

//TODO fix getting import paths for components, currently only works for relative files
//put in location and format that the preprocessing script can deal with


