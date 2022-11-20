import Thing from "./imports.svelte";

new Thing({
    target: document.body,
    props: {
        test: "test",
    },
});
