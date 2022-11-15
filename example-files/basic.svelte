<script>
    export let used = 'world';
    export let neverSet = "whatver";
    const constant = "constant";

    function doStuff() {
        used = "people";
    }
</script>

<button on:click={doStuff} value={constant}>
    Hello {used}! This is a test {neverSet} and {constant}.
</button>
