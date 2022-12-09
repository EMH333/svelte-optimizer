<script>
    export let used = 'world';
    export let neverSet = "whatver";
    const constant = "constant";
    const trueBool = true;
    const falseBool = false;

    function doStuff() {
        if (trueBool) {
            console.log("true");
        } else {
            console.log("false");
        }
        if (falseBool) {
            console.log("true");
        } else {
            console.log("false");
        }
        used = "people";
    }
</script>

<button on:click={doStuff} value={constant}>
    Hello {used}! This is a test {neverSet} and {constant}.
</button>

{#if trueBool}
    <p>True with True</p>
{:else}
    <p>False with True</p>
{/if}

{#if falseBool}
    <p>False with False</p>
{:else}
    <p>True with False</p>
{/if}

{#if trueBool && falseBool}
    <p>True with Expression</p>
{:else if trueBool}
    <p>False else if with Expression</p>
{:else}
    <p>False with Expression</p>
{/if}
