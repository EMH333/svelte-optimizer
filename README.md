# Project Level Optimization for Svelte

Say you have a Svelte compontent library which contains a (in this case pointless) compontent that looks like this:
```svelte
<script>
export let multiple = false;
export let debug = false;

let clicked = 0;

function action(event) {
    if (debug) {
        console.log("It was clicked!");
    }
    clicked++;
}
</script>

<button on:click={action}>Click me</button>
{#if multiple}
    ... multiple things
{:else}
    ... one thing
    Button clicked {clicked} times
{/if}
```

Now suppose you have an application that never sets multiple or debug to `true`. Since the Svelte compiler only works on a single component at a time, it has no way to optimize away that code. Since generated Svelte code is so complex, most bundlers don't get very far when trying to optimize it.

So what if instead of looking at individual components, we looked at the project as a whole? If we see that `multiple` or any other attribute/property isn't used anywhere (or has the same value everywhere), then we should be able to optimize for that case. 

This repo is a proof of concept for these sort of optimizations. You can run the simple proof of concept with `npm install` then `node fullTest.js true` which will show the byte difference in the output for a simple example before and after optimization. Right now it's at 62% of the original, but I expect that number to decrease as more complex optmizations are added.

Eventually, the preprocessor should scan the Svelte component AST and do optimizations based on that instead of the current regex based approach.

## Fuzzing
`export NODE_OPTIONS=--max_old_space_size=4096` can be useful if the fuzzer is running out of memory. Adding `--versifier=false` also decreases memory usage for some reason. This may be a case where the garbage collector can't keep up and slowing down the run time may be helpful.

Fuzzing has so far found one bug, but nothing too far beyond that, when run with the test files and example files as seeds. Seems to take up a lot of memory.
