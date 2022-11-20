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
