<script>
  import Basic from "./basic.svelte";
  import AutoComplete from "simple-svelte-autocomplete";

  const colors = ["White", "Red", "Yellow", "Green", "Blue", "Black"];
  let selectedColor;
</script>

<Basic used="TESTING" />
<AutoComplete items="{colors}" bind:selectedItem="{selectedColor}" />
