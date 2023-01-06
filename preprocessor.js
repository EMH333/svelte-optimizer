import MagicString from "magic-string";
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

                // handle ternary operators
                content = content.replace(new RegExp(`\\?\\s*${t}\\s*:\\s*`, "g"), `? true : `);
                content = content.replace(new RegExp(`\\?\\s*!\\s*${t}\\s*:\\s*`, "g"), `? false : `);

                // boolean short-circuiting if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*${t}\\s*&&\\s*`, "g"), `if(true&&`);
                content = content.replace(new RegExp(`if\\s*\\(\\s*${t}\\s*\\|\\|\\s*`, "g"), `if(true||`);
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${t}\\s*&&\\s*`, "g"), `if(false&&`);
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${t}\\s*\\|\\|\\s*`, "g"), `if(false||`);
            }

            // replace all occurences of constFalse with false
            for (const f of constFalse) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${f}\\s*\\)`, "g"), `if(false)`);
                // handle NOT if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${f}\\s*\\)`, "g"), `if(true)`);

                // handle ternary operators
                content = content.replace(new RegExp(`\\?\\s*${f}\\s*:\\s*`, "g"), `? false : `);
                content = content.replace(new RegExp(`\\?\\s*!\\s*${f}\\s*:\\s*`, "g"), `? true : `);

                // boolean short-circuiting if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*${f}\\s*&&\\s*`, "g"), `if(false&&`);
                content = content.replace(new RegExp(`if\\s*\\(\\s*${f}\\s*\\|\\|\\s*`, "g"), `if(false||`);
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${f}\\s*&&\\s*`, "g"), `if(true&&`);
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${f}\\s*\\|\\|\\s*`, "g"), `if(true||`);
            }

            // replace all occurences of constUndefined with false
            for (const u of constUndefined) {
                content = content.replace(new RegExp(`if\\s*\\(\\s*${u}\\s*\\)`, "g"), `if(false)`);
                // handle NOT if statements
                content = content.replace(new RegExp(`if\\s*\\(\\s*!\\s*${u}\\s*\\)`, "g"), `if(true)`);

                // handle ternary operators
                content = content.replace(new RegExp(`\\?\\s*${u}\\s*:\\s*`, "g"), `? false : `);
            }

            //TODO more could be done here like doing the same thing with the actual svelte ast (checking for 'and' conditions in if statements)

            //console.log(content);
            return { code: content };
        },
        markup: ({ content, filename }) => {
            const { vars, ast } = compile(content, {
                filename,
                generate: false,
                dev: false,
                varsReport: "full"
            });

            const { unwritten } = getWrittenAndUnwrittenVars(vars, usedExternal);

            //TODO eventually everything can go in here, but for now, we'll just do the constants
            const constants = new Map();

            const constTrue = new Set();
            const constFalse = new Set();
            const constUndefined = new Set();
            for (const v of vars) {
                //TODO make sure this is within script tags
                const matchTrue = content.match(new RegExp(`const ${v.name} = true`));
                const matchFalse = content.match(new RegExp(`const ${v.name} = false`));
                const matchUndefined = content.match(new RegExp(`const ${v.name} = undefined`));
                const matchEmptyString = content.match(new RegExp(`const ${v.name} = ""`));
                const matchEmptyArray = content.match(new RegExp(`const ${v.name} = \\[\\]`));
                const matchConstantString = content.match(new RegExp(`const ${v.name} = ".*?"`));
                if (matchTrue) {
                    constTrue.add(v.name);
                }
                if (matchFalse) {
                    constFalse.add(v.name);
                }
                if (matchUndefined) {
                    constUndefined.add(v.name);
                }
                if (matchEmptyString) {
                    constants.set(v.name, { type: "EmptyString" });
                }
                if (matchEmptyArray) {
                    constants.set(v.name, { type: "EmptyArray" });
                }
                if (matchConstantString) {
                    constants.set(v.name, { type: "ConstantString", value: matchConstantString[0].split("=")[1].trim() });
                }
            }

            // since they haven't been optimized yet, we need a special case here
            for (const name of unwritten) {
                const matchTrue = content.match(new RegExp(`export let ${name} = true`));
                const matchFalse = content.match(new RegExp(`export let ${name} = false`));
                const matchUndefined = content.match(new RegExp(`export let ${name} = undefined`));
                const matchEmptyString = content.match(new RegExp(`export let ${name} = ""`));
                const matchEmptyArray = content.match(new RegExp(`export let ${name} = \\[\\]`));
                const matchConstantString = content.match(new RegExp(`export let ${name} = ".*?"`));
                if (matchTrue) {
                    constTrue.add(name);
                }
                if (matchFalse) {
                    constFalse.add(name);
                }
                if (matchUndefined) {
                    constUndefined.add(name);
                }
                if (matchEmptyString) {
                    constants.set(name, { type: "EmptyString" });
                }
                if (matchEmptyArray) {
                    constants.set(name, { type: "EmptyArray" });
                }
                if (matchConstantString) {
                    constants.set(name, { type: "ConstantString", value: matchConstantString[0].split("=")[1].trim() });
                }
            }


            for (const t of constTrue) {
                constants.set(t, { type: "Literal", value: true });
            }
            for (const f of constFalse) {
                constants.set(f, { type: "Literal", value: false });
            }
            for (const u of constUndefined) {
                constants.set(u, { type: "Literal", value: undefined });
            }
            content = dealWithAST(content, ast, unwritten, constants);

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


//TODO pass content to function and deal with it
/**
 * 
 * @param {import("svelte/types/compiler/interfaces").Ast} ast 
 * @param {*} unwritten 
 * @param {Map<String, any>} constants
 * @returns {string} The new content
 */
function dealWithAST(content, ast, unwritten, constants) {
    const script = ast.instance.content.body;
    const html = ast.html;
    //console.log(html)

    const magicString = new MagicString(content);

    processASTHTML(magicString, html, constants);

    return magicString.toString();
}

/**
 * 
 * @param {MagicString} magicString
 * @param {import("svelte/types/compiler/interfaces").TemplateNode} ast 
 * @param {Map<String, any>} constants
 */
function processASTHTML(magicString, ast, constants) {
    switch (ast.type) {
        case "Text":
            break;
        case "RawMustacheTag":
        case "MustacheTag":
            //console.log("MustacheTag", ast)
            break;
        case "IfBlock":
            //console.log("IfBlock", ast.expression)
            const result = evaluateExpression(ast.expression, constants);
            //processExpression(magicString, ast.expression, constants);
            if (result === true) {
                // we can get rid of the else or else if blocks
                magicString.remove(ast.start, ast.children[0].start);
                magicString.remove(ast.children[ast.children.length - 1].end, ast.end);
            }
            if (result === false) {
                //TODO more work needed here to extract most optimization
                //we can get rid of the if block but need to look at the else if and else blocks
                if (ast.else?.children?.[0].elseif === true) {
                    processASTHTML(magicString, ast.else.children[0], constants);
                } if (ast.else) {
                    magicString.remove(ast.start, ast.else.children[0].start);
                    magicString.remove(ast.else.children[ast.children.length - 1].end, ast.end);
                    //set the else block as the ast we are looking at
                    ast = ast.else;
                } else {
                    magicString.remove(ast.start, ast.end);
                    //can return directly, no need to evaluate children
                    return;
                }
            }
            if (result === undefined) {
                //we can't do anything other than look at the children
                //if (ast.else?.children?.[0].elseif === true) {
                //    processASTHTML(magicString, ast.else.children[0], constants);
                //}
                //console.log("undefined")
            }
            break;
        case "Window":
        case "Element":
        case "Fragment":
        case "Slot":
        case "InlineComponent":
            //don't need to do anything but process children
            ast.attributes?.forEach((attribute) => {
                processAttributes(magicString, attribute, constants);
            });
            break;
        case "EachBlock":
            //TODO tackle at another time
            break;
        case "AttributeShorthand":
            //TODO tackle at another time
            //console.log("AttributeShorthand", ast)
            break;

        default:
            console.log("default", ast.type)
            break;
    }
    ast.children?.forEach((child) => processASTHTML(magicString, child, constants));
}

/**
 * 
 * @param {*} ast 
 * @param {*} constants 
 * @returns {boolean | undefined}
 */
function evaluateExpression(ast, constants) {
    switch (ast.type) {
        case "Identifier":
            //TODO deal with empty arrays/string and other stuff in a better way
            if (constants.has(ast.name) && (constants.get(ast.name).type === "Literal" || constants.get(ast.name).type === "ConstantString")) {
                return constants.get(ast.name).value;
            }
            return undefined;
        case "LogicalExpression":
            const left = evaluateExpression(ast.left, constants);
            const right = evaluateExpression(ast.right, constants);
            if (left === true && ast.operator === "||") {
                return true;
            }
            if (left === false && ast.operator === "&&") {
                return false;
            }
            if (left === false && ast.operator === "||") {
                return right;
            }
            if (left === true && ast.operator === "&&") {
                return right;
            }
            return undefined;
        case "UnaryExpression":
            const value = evaluateExpression(ast.argument, constants);
            if (value === true && ast.operator === "!") {
                return false;
            }
            if (value === false && ast.operator === "!") {
                return true;
            }
            return undefined;
        case "Literal":
            switch (ast.value) {
                case "true":
                    return true;
                case "false":
                    return false;
                default:
                    return undefined;
            }
        case "BinaryExpression":
            const leftValue = evaluateExpression(ast.left, constants);
            const rightValue = evaluateExpression(ast.right, constants);
            // can't do anything if we don't know the value of both sides
            if(leftValue === undefined || rightValue === undefined) {
                return undefined;
            }
            if (ast.operator === "===" || ast.operator === "==") {
                return leftValue === rightValue;
            }
            if (ast.operator === "!==" || ast.operator === "!=") {
                return leftValue !== rightValue;
            }
            return undefined;

    }
    return undefined;
}

/**
 * @param {MagicString} magicString
 * @param {import("svelte/types/compiler/interfaces").Attribute} attribute
 * @param {Map<String, any>} constants
 */
function processAttributes(magicString, attribute, constants) {
    switch (attribute.type) {
        case "EventHandler":
            //TODO
            break;
        case "Attribute":
            //console.log("Attribute", attribute)
            if (attribute.value instanceof Array) {
                attribute.value?.forEach((value) => {
                    processASTHTML(magicString, value, constants);
                });
            }
            break;
        case "Binding":
        case "Class":
            //console.log("Class", attribute)
            const result = evaluateExpression(attribute.expression, constants);
            if (result === true) {
                //replace expression with true
                magicString.overwrite(attribute.expression.start, attribute.expression.end, "true");
                //console.log(attribute.expression)
            }
            if (result === false) {
                //get rid of the attribute
                magicString.remove(attribute.start, attribute.end);
            }
            break;
        case "Animation":
        case "Transition":
        case "Spread":
            //console.log("other attribute", attribute)
            //TODO deal with this later
            break;
        default:
            console.log("default attribute", attribute.type)
            break;
    }
}
