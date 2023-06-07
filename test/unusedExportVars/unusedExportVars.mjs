import { test } from "uvu";
import * as assert from "uvu/assert";
import * as esbuild from "esbuild";
import buildSettings from "../esbuildTestSettings.js";

test("unusedExportVarsAreConvertedToConst", async () => {
    await esbuild
    .build({
        entryPoints: ["test/unusedExportVars/entry.js"],
        ...buildSettings(new Set()),
    })
    .catch(() => {throw new Error("Build failed")})
    .then((result) => {
        const code = result.outputFiles[0].text;
        assert.not.match(code, /return \$\$self\.\$\$set/);
        assert.not.match(code, /invalidate/);
    });
});

test.run();
