import { test } from "uvu";
import * as assert from "uvu/assert";
import * as esbuild from "esbuild";
import buildSettings from "../esbuildTestSettings.js";

test("ifStatements", async () => {
    await esbuild
    .build({
        entryPoints: ["test/ifStatements/entry.js"],
        ...buildSettings(new Set()),
    })
    .catch(() => {throw new Error("Build failed")})
    .then((result) => {
        const code = result.outputFiles[0].text;
        assert.equal(code.match(/Inner_Correct/g).length, 4);
        assert.not.match(code, /Incorrect/);
    });
});

test.run();
