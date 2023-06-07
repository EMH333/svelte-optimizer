<script>
    const trueBool = true;
    const falseBool = false;
</script>

{#if trueBool}
    <p>Correct</p>
{:else}
    <p>Incorrect</p>
{/if}

{#if falseBool}
    <p>Incorrect</p>
{:else}
    <p>Correct</p>
{/if}

{#if trueBool && falseBool}
    <p>Incorrect</p>
{:else if trueBool}
    <p>Correct</p>
{:else}
    <p>Incorrect</p>
{/if}
