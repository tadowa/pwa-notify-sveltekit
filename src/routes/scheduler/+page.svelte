<script lang="ts">
  import MatterCanvas from './MatterCanvas.svelte';
  import Controls from './components/Controls.svelte';

  let canvasRef: any;
</script>

<MatterCanvas bind:this={canvasRef} />

<Controls
  collapseSelected={() => canvasRef?.collapseSelected()}
  expandSelected={() => canvasRef?.expandSelected()}
/>

<style>
:global(body) { margin: 0; }
</style>
