import { readFileSync } from "fs";
import { opendir } from "fs/promises";
import path from "path";
import { compile } from "svelte/compiler";
import * as resolve from "resolve.exports";


export function scanFile(filename) {
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

    // get package.json in current directory
    function getPackageJson() {
        try {
            return JSON.parse(readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"));
        } catch (e) {
            console.error("Could not find package.json in current directory");
            return {};
        }
    }

    function readPackagePackageJsonFile(pkg) {
        try {
            return JSON.parse(readFileSync(path.resolve(process.cwd(), "node_modules", pkg, "package.json"), "utf8"));
        } catch (e) {
            console.error(`Could not find package.json in ${pkg} node_modules directory`);
            return {};
        }
    }

    const packageJson = getPackageJson();
    const packages = [...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {})];


    //console.log(JSON.stringify(components, null, 2));
    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        // find import for component.name
        const importStatement = file.match(new RegExp(`import\\s+${component.name}\\s+from\\s+['"](.+)['"]`));
        if (importStatement) {
            const importPath = importStatement[1];

            if (importPath.startsWith(".")) {
                //TODO https://github.com/lukeed/resolve.exports
                components[i].importPath = path.resolve(path.dirname(filename), importPath);
            } else {
                //TODO some more complex logic to get the import path because it's probably a package
                //components[i].importPath = importPath;
                components[i].importPath = resolve.exports(packageJson, importPath, { conditions: ["svelte"] });

                packages.forEach((pkg) => {
                    if (importPath.startsWith(pkg)) {
                        const pkgPackageJsonFile = readPackagePackageJsonFile(pkg);
                        components[i].importPath = resolve.exports(pkgPackageJsonFile, importPath, { conditions: ["svelte"] })?.[0];
                        if (!components[i].importPath) {
                            // then we need to use the legacy route
                            components[i].importPath = path.resolve(process.cwd(), "node_modules", pkg, resolve.legacy(pkgPackageJsonFile, { fields: ["svelte"] }));
                        }
                        return true;
                    }
                });
            }
        }
    }
    return components;
}

//given a directory, scan all svelte files in that directory and subdirectories for component usage with scanFile
export async function scanDir(dirPath) {
    const components = [];

    const dir = await opendir(dirPath)
    for await (const dirent of dir) {
        const entryPath = path.join(dirPath, dirent.name);
        if (dirent.isDirectory()) {
            const subComponents = await scanDir(entryPath);
            components.push(...subComponents);
        } else if (dirent.isFile() && dirent.name.endsWith(".svelte")) {
            const subComponents = scanFile(entryPath);
            components.push(...subComponents);
        }
    }

    return components;
}


