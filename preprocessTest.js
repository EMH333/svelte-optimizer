import { readFileSync } from "fs";
import { preprocess, compile } from "svelte/compiler";

//get filename from command line
const filename = process.argv[2];

//read file
const file = readFileSync(filename, "utf8");

const usedExternal = new Set();


//run svelte preprocess on it
const { code } = await preprocess(file, [{
    script: ({ content, attributes, markup, filename }) => {

        //TODO unexport vars not used externally

        const {vars} = compile(markup, {
            filename,
            generate: false,
            dev: false,
            varsReport: "full"
        });

        const allVars = new Set(vars.filter((v)=> v.writable && v.export_name !== null ).map(v => v.name));
        const written = new Set(usedExternal);

        for (const v of vars) {
            if (v.writable && v.export_name !== null && (v.mutated || v.reassigned)) {
                written.add(v.name);
            }
        }
        
        const unwritten = [...allVars].filter(v => !written.has(v));

        for (const u of unwritten) {
            content = content.replace(new RegExp(`export let ${u}`), `const ${u}`);
        }

        //console.log(content);
        return { code: content };
    }
}]);

console.log("\n\nCode:", code);
