import path from "path";
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

            const { unwritten } = getWrittenAndUnwrittenVars(vars, usedExternal, filename);

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

            const { unwritten } = getWrittenAndUnwrittenVars(vars, usedExternal, filename);

            //TODO eventually everything can go in here, but for now, we'll just do the constants
            // constants is a set of objects keyed by name with the following properties:
            // type: "EmptyString" | "EmptyArray" | "Literal"
            // value: the value of the constant
            const constants = new Map();
            for (const v of vars) {
                //TODO make sure this is within script tags
                const matchTrue = content.match(new RegExp(`(const|export let) ${v.name} = true`));
                const matchFalse = content.match(new RegExp(`(const|export let) ${v.name} = false`));
                const matchUndefined = content.match(new RegExp(`(const|export let) ${v.name} = undefined`));
                const matchEmptyString = content.match(new RegExp(`(const|export let) ${v.name} = ""`));
                const matchEmptyArray = content.match(new RegExp(`(const|export let) ${v.name} = \\[\\]`));
                const matchConstantString = content.match(new RegExp(`(const|export let) ${v.name} = "(.*?)";?\n`));
                const matchInteger = content.match(new RegExp(`(const|export let) ${v.name} = (\\d+);?\n`));

                const matchExport = content.match(new RegExp(`export let ${v.name} =`));
                if (matchExport && !unwritten.includes(v.name)) {
                    //exported variables used ouside of the componet can't be optimized
                    continue;
                }

                if (matchTrue) {
                    constants.set(v.name, { type: "Literal", value: true });
                }
                if (matchFalse) {
                    constants.set(v.name, { type: "Literal", value: false });
                }
                if (matchUndefined) {
                    constants.set(v.name, { type: "Literal", value: undefined });
                }
                if (matchEmptyString) {
                    constants.set(v.name, { type: "EmptyString" });
                }
                if (matchEmptyArray) {
                    constants.set(v.name, { type: "EmptyArray" });
                }
                if (matchConstantString) {
                    constants.set(v.name, { type: "Literal", value: matchConstantString[2] });
                }
                if (matchInteger) {
                    constants.set(v.name, { type: "Literal", value: parseInt(matchInteger[2]) });
                }
            }

            content = dealWithAST(content, ast, unwritten, constants);
            //console.log(content);
            return { code: content };
        }
    };
}

function getWrittenAndUnwrittenVars(vars, usedExternal, filename) {
    const absFilename = path.resolve(process.cwd(), filename);

    const allVars = new Set(vars.filter((v) => v.writable && v.export_name !== null).map(v => v.name));
    const written = new Set(usedExternal[absFilename]); //TODO support way to statically set the value of written variables if same across project

    for (const v of vars) {
        if (v.writable && v.export_name !== null && (v.mutated || v.reassigned)) {
            written.add(v.name);
        }
    }

    const unwritten = [...allVars].filter(v => !written.has(v));

    return { written, unwritten };
}


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

    try {
        processASTHTML(magicString, html, constants);
    } catch (e) {
        //console.log("Original:\n", content, "-------------------------");
        //console.log("Modified:\n", magicString.toString());
        throw e;
    }

    return magicString.toString();
}

/**
 * 
 * @param {MagicString} magicString
 * @param {import("svelte/types/compiler/interfaces").TemplateNode} ast 
 * @param {Map<String, any>} constants
 */
function processASTHTML(magicString, ast, constants) {
    //console.log(`\n\n${magicString.toString()}\n`, ast.elseif, ast.children?.length, ast.start, ast.end)
    switch (ast.type) {
        case "Text":
        case "Comment":
            break;
        case "RawMustacheTag":
        case "MustacheTag":
            {
                const result = evaluateExpression(ast.expression, constants);
                if (result !== undefined) {
                    //console.log(result.toString())
                    magicString.overwrite(ast.start, ast.end, result.toString());
                }
            }
            break;
        case "IfBlock":
            // deal with else if blocks correctly
            if (ast.elseif === true) {
                ast.end = ast.else ? ast.else.end : ast.children[ast.children.length - 1].end;
            }

            let result = evaluateExpression(ast.expression, constants);
            //since this is being evaluated, try to get it into a boolean
            if (result !== undefined) {
                result = !!result;
            }
            switch (result) {
                case true:
                    {
                        // if this is an else if, then it needs to be converted to an :else, and the else needs to be removed
                        if (ast?.elseif) {
                            magicString.overwrite(ast.start, ast.children[0].start, "\n{:else}\n");
                            //we aren't really doing anything here if there is no else block
                            if (ast.children[ast.children.length - 1].end !== ast.end) {
                                magicString.overwrite(ast.children[ast.children.length - 1].end, ast.end, "\n");
                            }
                        } else {
                            // we can get rid of the else or else if blocks
                            magicString.remove(ast.start, ast.children[0].start);
                            magicString.remove(ast.children[ast.children.length - 1].end, ast.end);
                        }
                    }
                    break;
                case false:
                    {
                        //we can get rid of the if block but need to look at the else if and else blocks
                        if (ast.else?.children?.[0].elseif === true && !ast?.elseif) {
                            magicString.overwrite(ast.start, ast.else.children[0].expression.start, "\n{#if ");
                            ast.else.children[0].start = ast.start;

                            // if the child is not another if else block, then we can remove the else block
                            if (ast.else.children[0].children[0].type !== "IfBlock" && ast.else.children[0].children[0].elseif !== true) {
                                ast.else.children[0].elseif = false;
                            }

                            processASTHTML(magicString, ast.else.children[0], constants);
                            return;
                        } else if (ast.else?.children?.[0].elseif === true && ast?.elseif) {
                            // instead of just being an independent if block, be an else if block
                            magicString.overwrite(ast.start, ast.else.children[0].expression.start, "\n{:else if ");
                            ast.else.children[0].start = ast.start;


                            processASTHTML(magicString, ast.else.children[0], constants);
                            return;
                        } else if (ast.else) {
                            magicString.remove(ast.start, ast.else.children[0].start);
                            magicString.remove(ast.else.children[ast.else.children.length - 1].end, ast.end);
                            //set the else block as the ast we are looking at
                            ast = ast.else;
                        } else {
                            magicString.remove(ast.start, ast.end);
                            //can return directly, no need to evaluate children
                            return;
                        }
                    }
                    break;
                case undefined:
                    // this is in cases where the result can not be statically evaluated
                    {
                        //don't get rid of the if block but need to look at the else if blocks
                        if (ast.else) {
                            //weird hack to get rid of the else if block if it can be removed
                            if (ast.else?.children?.[0].elseif === true) {
                                ast.else.children[0].start = ast.children[ast.children.length - 1].end;
                            }
                            processASTHTML(magicString, ast.else, constants);
                        }
                    }
                    break;
                default:
                    console.log("Unknown if result", result);
                    break;
            }
            break;
        case "ElseBlock":
            //This gets handled in the IfBlock section
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
            const expression = evaluateExpression(ast.expression, constants);
            if (Array.isArray(expression) && expression.length === 0) {
                if (ast.else) {
                    magicString.remove(ast.start, ast.else.children[0].start);
                    magicString.remove(ast.else.children[ast.else.children.length - 1].end, ast.end);
                    //set the else block as the ast we are looking at
                    ast = ast.else;
                } else {
                    magicString.remove(ast.start, ast.end);
                    return; // no need to evaluate children
                }
            }
            break;
        case "AttributeShorthand":
            // TODO in the future this could set known variables statically
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
 * @param {boolean} undefinedAsFalse
 * @returns {boolean | undefined | any}
 */
function evaluateExpression(ast, constants, undefinedAsFalse = false) {
    switch (ast.type) {
        case "Identifier":
            if (constants.has(ast.name) && constants.get(ast.name).type === "Literal") {
                let val = constants.get(ast.name).value;
                // we know we have defined it as a constant, and the caller is asking for a boolean
                if (val === undefined && undefinedAsFalse) {
                    return false;
                }
                return val;
            }
            if (constants.has(ast.name) && constants.get(ast.name).type === "EmptyArray") {
                return [];
            }
            if (constants.has(ast.name) && constants.get(ast.name).type === "EmptyString") {
                return "";
            }
            return undefined;
        case "LogicalExpression":
            const left = evaluateExpression(ast.left, constants, undefinedAsFalse = true);
            const right = evaluateExpression(ast.right, constants, undefinedAsFalse = true);
            if (left === true && ast.operator === "||") {
                return true;
            }
            if ((left === false || right === false) && ast.operator === "&&") {
                return false;
            }
            if (left === false && ast.operator === "||") {
                return right;
            }
            if (left === true && ast.operator === "&&") {
                return right;
            }
            if ((left === undefined || right === undefined) && (ast.operator === "&&" || ast.operator === "||")) {
                return undefined;
            }
            console.log("default logical", left, ast.operator, right)
            return undefined;
        case "UnaryExpression":
            const value = evaluateExpression(ast.argument, constants, undefinedAsFalse = true);
            if (value === true && ast.operator === "!") {
                return false;
            }
            if (value === false && ast.operator === "!") {
                return true;
            }
            if (value === undefined && ast.operator === "!") {
                return undefined;
            }
            console.log("default unary", value, ast.operator)
            return undefined;
        case "Literal":
            switch (typeof ast.value) {
                case "boolean":
                    return Boolean(ast.value);
                case "number":
                    return Number(ast.value);
                case "string":
                    return ast.value;
                default:
                    console.log("default literal", typeof ast.value, ast.value);
                    return undefined;
            }
        case "BinaryExpression":
            const leftValue = evaluateExpression(ast.left, constants, undefinedAsFalse = true);
            const rightValue = evaluateExpression(ast.right, constants, undefinedAsFalse = true);
            // can't do anything if we don't know the value of both sides
            if (leftValue === undefined || rightValue === undefined) {
                return undefined;
            }
            if (ast.operator === "===") {
                return leftValue === rightValue;
            }
            if (ast.operator === "==") {
                return leftValue == rightValue;
            }
            if (ast.operator === "!==") {
                return leftValue !== rightValue;
            }
            if (ast.operator === "!=") {
                return leftValue != rightValue;
            }
            if (ast.operator === ">") {
                return leftValue > rightValue;
            }
            if (ast.operator === ">=") {
                return leftValue >= rightValue;
            }
            if (ast.operator === "<") {
                return leftValue < rightValue;
            }
            if (ast.operator === "<=") {
                return leftValue <= rightValue;
            }
            if (ast.operator === "+") {
                return leftValue + rightValue;
            }
            if (ast.operator === "-") {
                return leftValue - rightValue;
            }
            if (ast.operator === "*") {
                return leftValue * rightValue;
            }
            if (ast.operator === "/") {
                return leftValue / rightValue;
            }
            if (ast.operator === "%") {
                return leftValue % rightValue;
            }
            if (ast.operator === "**") {
                return leftValue ** rightValue;
            }
            if (ast.operator === "&") {
                return leftValue & rightValue;
            }
            if (ast.operator === "|") {
                return leftValue | rightValue;
            }
            if (ast.operator === "^") {
                return leftValue ^ rightValue;
            }
            if (ast.operator === "<<") {
                return leftValue << rightValue;
            }
            if (ast.operator === ">>") {
                return leftValue >> rightValue;
            }
            return undefined;
        case "ConditionalExpression":
            //again we can evaluate this as a boolean
            let test = evaluateExpression(ast.test, constants, undefinedAsFalse = true);
            if (test !== undefined) {
                test = !!test;
            }
            if (test === true) {
                return evaluateExpression(ast.consequent, constants);
            }
            if (test === false) {
                return evaluateExpression(ast.alternate, constants);
            }
            return undefined;
        case "MemberExpression":
        case "CallExpression":
            //Can't do much with these in the current iteration
            return undefined;
        default:
            console.log("default expression", ast.type)
            break;
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
                    if (value.type === 'MustacheTag') {
                        const result = evaluateExpression(value.expression, constants);
                        if (typeof result === 'string') {
                            //replace expression with string
                            magicString.overwrite(value.expression.start, value.expression.end, `"${result}"`);
                        } else if (result === undefined) {
                            return;
                        } else {
                            // replace expression with value
                            magicString.overwrite(value.expression.start, value.expression.end, `${result}`);
                        }
                    } else {
                        processASTHTML(magicString, value, constants);
                    }
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
            //TODO more here
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
