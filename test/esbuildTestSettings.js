import esbuildSvelte from "esbuild-svelte";
import preprocess from "../preprocessor.js";

export default function esbuildTestSettings(usedExternal) {
    return {
        mainFields: ["svelte", "browser", "module", "main"],
        bundle: true,
        minify: false, // only minify if doing a comparison
        minifySyntax: true,
        pure: ["console.log"],
        format: "esm",
        target: "es2019",
        outdir: "./dist",
        write: false,
        plugins: [
            esbuildSvelte({
                preprocess: preprocess(usedExternal),
                filterWarnings: (warning) => {
                    if (warning.code === "a11y-click-events-have-key-events") {
                        return false;
                    }
                    return true;
                }
            }),
        ],
    }
};
