import Thing from "./someExportVars.svelte";

new Thing({
    target: document.body,
    props: {
        test: "test",
    },
});
