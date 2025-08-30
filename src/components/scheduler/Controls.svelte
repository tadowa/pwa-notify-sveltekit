<!-- src\routes\scheduler\components\Controls.svelte -->
<script lang="ts">
  export let collapseSelected: () => void;
  export let expandSelected: () => void;
</script>

<div class="controls">
  <button on:click={collapseSelected}>畳み込み</button>
  <button on:click={expandSelected}>展開</button>
</div>

<style>
.controls {
  position: absolute;
  bottom: 8px; /* 上ではなく下に配置 */
  left: 8px;
  display: flex;
  gap: 8px;
  z-index: 10;
}
button {
  padding: 6px 12px;
  background: #e67e22;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
button:hover {
  background: #d35400;
}
</style>