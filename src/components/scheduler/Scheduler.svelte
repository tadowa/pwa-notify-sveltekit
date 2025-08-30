<script lang="ts">
  import MatterCanvas from './MatterCanvas.svelte';
  import Controls from './Controls.svelte';
  import { tasks, type Task } from './tasksStore';

  let canvasRef: any;
</script>

<!-- store 自体を props として渡す -->
<MatterCanvas bind:this={canvasRef} />

<Controls
  collapseSelected={() => canvasRef?.collapseSelected()}
  expandSelected={() => canvasRef?.expandSelected()}
/>

<style>
  :global(body) {
    margin: 0;
    font-family: sans-serif;
  }
</style>
