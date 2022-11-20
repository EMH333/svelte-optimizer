import { compile } from "svelte/compiler";

export default (usedExternal) => {
    return {
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
    };
}
