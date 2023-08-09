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

{#if falseBool}
  <p>Incorrect</p>
{:else if falseBool}
  <p>Incorrect</p>
{:else if trueBool}
  <p>Correct</p>
  {#if trueBool}
    <p>Inner_Correct</p>
  {:else}
    <p>Incorrect</p>
  {/if}
{:else if trueBool}
  <p>Incorrect</p>
{:else}
  <p>Incorrect</p>
{/if}

{#if trueBool && falseBool}
  <p>Incorrect</p>
{:else if falseBool}
  <p>Incorrect</p>
{:else if trueBool}
  <p>Correct</p>
  {#if trueBool}
    <p>Inner_Correct</p>
  {:else}
    <p>Incorrect</p>
  {/if}
{:else}
  <p>Incorrect</p>
{/if}

<!--an undefined value for the if-->
{#if trueBool && Math.random() > 0.5}
  <p>Correct</p>
{:else if falseBool}
  <p>Incorrect</p>
{:else if trueBool}
  <p>Correct in Else</p>
  {#if trueBool}
    <p>Inner_Correct in Else</p>
  {:else}
    <p>Incorrect</p>
  {/if}
{:else}
  <p>Incorrect</p>
{/if}

<!--only the if and the first else if should remain-->
{#if trueBool && Math.random() > 0.5}
  <p>Correct</p>
{:else if trueBool}
  <p>Correct in Else</p>
  {#if trueBool}
    <p>Inner_Correct in Else</p>
  {:else}
    <p>Incorrect</p>
  {/if}
{:else if trueBool}
  <p>Incorrect</p>
{:else}
  <p>Incorrect</p>
{/if}

<!--only the last else if and else should remain-->
{#if falseBool}
  <p>Incorrect</p>
{:else if falseBool}
  <p>Incorrect</p>
{:else if undefined}
  <p>Correct</p>
{:else}
  <p>Correct in Else</p>
{/if}

<!--check case where there is no else at the end-->
{#if undefined}
  <p>Correct</p>
{:else if falseBool}
  <p>Incorrect</p>
{:else if "some string"}
  <p>Correct</p>
{/if}
