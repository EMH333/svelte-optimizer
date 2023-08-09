<script>const falseBool = false;const trueBool = true;</script>
{#if falseBool}
  <p>Incorrect</p>
{:else if trueBool}
  <p>Correct</p>
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
