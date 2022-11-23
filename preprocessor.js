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

            const { unwritten } = getWrittenAndUnwrittenVars(vars, usedExternal);

            for (const u of unwritten) {
                content = content.replace(new RegExp(`export let ${u}`), `const ${u}`);
            }


            // additional optimization for boolean variables
            // grab all const variables that are true or false
            const constTrue = new Set();
            const constFalse = new Set();
            const constUndefined = new Set();
            for (const v of vars) {
                //console.log(v)
                //check content if it gets initalized to true or false
                const matchTrue = content.match(new RegExp(`const ${v.name} = true`));
                const matchFalse = content.match(new RegExp(`const ${v.name} = false`));
                const matchUndefined = content.match(new RegExp(`const ${v.name} = undefined`));
                if (matchTrue) {
                    constTrue.add(v.name);
                }
                if (matchFalse) {
                    constFalse.add(v.name);
                }
                if (matchUndefined) {
                    constUndefined.add(v.name);
                }
            }

            // replace all occurences of constTrue with true
            for (const t of constTrue) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${t}\\s*\\)`, "g"), `if(true)`);
                // handle NOT if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${t}\\s*\\)`, "g"), `if(false)`);
            }

            // replace all occurences of constFalse with false
            for (const f of constFalse) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${f}\\s*\\)`, "g"), `if(false)`);
                // handle NOT if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${f}\\s*\\)`, "g"), `if(true)`);
            }

            // replace all occurences of constUndefined with false
            for (const u of constUndefined) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${u}\\s*\\)`, "g"), `if(false)`);
                // handle NOT if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${u}\\s*\\)`, "g"), `if(true)`);
            }

            //TODO more could be done here like doing the same thing with the actual svelte ast (checking for 'and' conditions in if statements)

            //console.log(content);
            return { code: content };
        },
        markup: ({ content, filename }) => {
            const { vars } = compile(content, {
                filename,
                generate: false,
                dev: false,
                varsReport: "full"
            });

            const { unwritten } = getWrittenAndUnwrittenVars(vars, usedExternal);

            const constTrue = new Set();
            const constFalse = new Set();
            const constUndefined = new Set();
            for (const v of vars) {
                //TODO make sure this is within script tags
                const matchTrue = content.match(new RegExp(`const ${v.name} = true`));
                const matchFalse = content.match(new RegExp(`const ${v.name} = false`));
                const matchUndefined = content.match(new RegExp(`const ${v.name} = undefined`));
                if (matchTrue) {
                    constTrue.add(v.name);
                }
                if (matchFalse) {
                    constFalse.add(v.name);
                }
                if (matchUndefined) {
                    constUndefined.add(v.name);
                }
            }

            // since they haven't been optimized yet, we need a special case here
            for (const name of unwritten) {
                const matchTrue = content.match(new RegExp(`export let ${name} = true`));
                const matchFalse = content.match(new RegExp(`export let ${name} = false`));
                const matchUndefined = content.match(new RegExp(`export let ${name} = undefined`));
                if (matchTrue) {
                    constTrue.add(name);
                }
                if (matchFalse) {
                    constFalse.add(name);
                }
                if (matchUndefined) {
                    constUndefined.add(name);
                }
            }

            for (const t of constTrue) {
                //`{#if clearable}` -> `{#if true}`
                content = content.replace(new RegExp(`{#if\\s*${t}\\s*}`, "g"), `{#if true}`);

                //`{:else if create}` -> `{:else if true}`
                content = content.replace(new RegExp(`{:else if\\s*${t}\\s*}`, "g"), `{:else if true}`);
            }

            // replace all occurences of constFalse with false
            for (const f of constFalse) {
                //`class:show-clear={clearable}` can be removed if clearable is false
                //-?[_a-zA-Z]+[_a-zA-Z0-9-]* represents all css classes
                content = content.replace(new RegExp(`class:(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)={${f}}`, "g"), ``);

                //`{#if clearable}` can be set to `{#if false}`
                content = content.replace(new RegExp(`{#if\\s*${f}\\s*}`, "g"), `{#if false}`);

                //`{:else if create}` can be set to `{:else if false}`
                content = content.replace(new RegExp(`{:else if\\s*${f}\\s*}`, "g"), `{:else if false}`);
            }

            for (const u of constUndefined) {
                //`on:input={onInput}` can be removed if onInput is undefined
                content = content.replace(new RegExp(`on:[a-zA-Z]+={${u}}`, "g"), ``);

                //`{#if clearable}` can be set to `{#if false}`
                content = content.replace(new RegExp(`{#if\\s*${u}\\s*}`, "g"), `{#if false}`);

                //`{:else if create}` can be set to `{:else if false}`
                content = content.replace(new RegExp(`{:else if\\s*${u}\\s*}`, "g"), `{:else if false}`);
            }

            return { code: content };
        }
    };
}

function getWrittenAndUnwrittenVars(vars, usedExternal) {
    const allVars = new Set(vars.filter((v) => v.writable && v.export_name !== null).map(v => v.name));
    const written = new Set(usedExternal);

    for (const v of vars) {
        if (v.writable && v.export_name !== null && (v.mutated || v.reassigned)) {
            written.add(v.name);
        }
    }

    const unwritten = [...allVars].filter(v => !written.has(v));

    return { written, unwritten };
}
