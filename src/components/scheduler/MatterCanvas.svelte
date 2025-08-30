<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PhysicsEngine } from './lib/utils/PhysicsEngine';
  import { tasks, type Task } from './tasksStore';
  import { schedules, type Schedule } from './schedulesStore';

  // export let tasks: Task[] = [];

  let canvasEl: HTMLCanvasElement;
  let physicsEngine: PhysicsEngine;

  const gridSize = 16 * 4;
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
    const unsubscribe_tasks = tasks.subscribe(taskList => {
      if (taskList) {
        physicsEngine.createBoxes(taskList); // taskList は配列
      }
    });
    const unsubscribe_schedule = schedules.subscribe(scheduleList => {
      if (scheduleList) {
        physicsEngine.createBoxes(scheduleList); // taskList は配列
      }
    });

    onDestroy(() => {
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
