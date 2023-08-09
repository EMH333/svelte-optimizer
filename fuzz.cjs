const { preprocess, compile } = require("svelte/compiler");
const preprocessor = require("./fuzzDist/preprocessor.cjs");

const samePreprocess = preprocessor.default({});

function fuzz(buf) {
    const input = buf.toString();

    try {
        compile(input);
    } catch (e) {
        // ignore, we don't care about errors in the inital compile
        return;
    }

    // call your package with buf  
    preprocess(input, [samePreprocess], { filename: "fuzz.svelte" }).then((output) => {
        const { code } = output;
        compile(code); // this will error out the function if it doesn't compile
    });
}
module.exports = {
    fuzz
};
