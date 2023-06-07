import { test } from "uvu";
import * as assert from "uvu/assert";
import * as esbuild from "esbuild";
import buildSettings from "../esbuildTestSettings.js";

test("#each with an empty array is removed", async () => {
    await esbuild
    .build({
        entryPoints: ["test/emptyEach/entry.js"],
        ...buildSettings(new Set()),
    })
    .catch(() => {throw new Error("Build failed")})
    .then((result) => {
        const code = result.outputFiles[0].text;
        assert.not.match(code, /return \$\$self\.\$\$set/);
        assert.not.match(code, /invalidate/);
        assert.not.match(code, /each_item/); // each_item is the name of the variable in the each block
        assert.match(code, /should_exist/); // else block of the each block
    });
});

test.run();
