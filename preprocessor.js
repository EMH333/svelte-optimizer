import { compile } from "svelte/compiler";

export default (usedExternal) => {
    return {
        script: ({ content, attributes, markup, filename }) => {

            //TODO unexport vars not used externally

            const { vars } = compile(markup, {
                filename,
                generate: false,
                dev: false,
                varsReport: "full"
            });

            const allVars = new Set(vars.filter((v) => v.writable && v.export_name !== null).map(v => v.name));
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


            // additional optimization for boolean variables
            // grab all const variables that are true or false
            const constTrue = new Set();
            const constFalse = new Set();
            for (const v of vars) {
                //console.log(v)
                //check content if it gets initalized to true or false
                const matchTrue = content.match(new RegExp(`const ${v.name} = true`));
                const matchFalse = content.match(new RegExp(`const ${v.name} = false`));
                if (matchTrue && !matchFalse) {
                    constTrue.add(v.name);
                }
                if (matchFalse && !matchTrue) {
                    constFalse.add(v.name);
                }

            }
            
            // replace all occurences of constTrue with true
            for (const t of constTrue) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${t}\\s*\\)`, "g"), `if(true)`);
            }

            // replace all occurences of constFalse with false
            for (const f of constFalse) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${f}\\s*\\)`, "g"), `if(false)`);
            }

            //TODO more could be done here like doing the same thing with the actual svelte ast

            //console.log(content);
            return { code: content };
        }
    };
}
