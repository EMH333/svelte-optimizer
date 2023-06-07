<script>
  export let each = [];
</script>

{#each each as each_item}
  <p>each_item: {each_item}</p>
{/each}

{#each each as each_item}
  <p>each_item: {each_item}</p>
{:else}
  <p>should_exist</p>
{/each}
