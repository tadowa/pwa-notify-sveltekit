<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  // エイリアスではなく、相対パスを使用する
  import { PhysicsEngine } from '../lib/utils/PhysicsEngine';
  import { tasks } from '../stores';

  let canvasEl: HTMLCanvasElement;
  let physicsEngine: PhysicsEngine;
  const gridSize = 80;
  const width = 1400;
  const height = 900;

  export function collapseSelected() {
    physicsEngine.collapseSelected();
  }

  export function expandSelected() {
    physicsEngine.expandSelected();
  }

  onMount(() => {
    physicsEngine = new PhysicsEngine(canvasEl, width, height, gridSize);

    const unsubscribe = tasks.subscribe(taskList => {
      if (taskList) {
        physicsEngine.createBoxes(taskList);
      }
    });

    onDestroy(() => {
      unsubscribe();
      physicsEngine.destroy();
    });
  });
</script>

<canvas bind:this={canvasEl}></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 80vh;
    background: #fafafa;
    border: 1px solid #ccc;
  }
</style>