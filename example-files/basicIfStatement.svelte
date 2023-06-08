<script>
  const falseBool = false;
</script>

{#if Math.random() > 0.5}
  <p>Correct 1</p>
{:else if falseBool}
  <p>Incorrect</p>
{/if}
