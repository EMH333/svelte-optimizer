import { test } from "uvu";
import * as assert from "uvu/assert";
import * as esbuild from "esbuild";
import buildSettings from "../esbuildTestSettings.js";

test("only some vars are unused externally", async () => {
    const testFile = process.cwd() + "/test/someExportVars/someExportVars.svelte"
    const usedExternal = {
        [testFile]: new Set(["usedVar"]),
    };
    await esbuild
    .build({
        entryPoints: ["test/someExportVars/entry.js"],
        ...buildSettings(usedExternal),
    })
    .catch(() => {throw new Error("Build failed")})
    .then((result) => {
        const code = result.outputFiles[0].text;
        assert.match(code, /\"usedVar\" in \$\$props2/);
        assert.not.match(code, /\"notUsedBool\" in \$\$props2/);
        assert.not.match(code, /\"notUsedString\" in \$\$props2/);
    });
});

test.run();
