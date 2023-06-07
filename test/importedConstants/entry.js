import Thing from "./importedConstants.svelte";

new Thing({
    target: document.body,
    props: {
        test: "test",
    },
});
