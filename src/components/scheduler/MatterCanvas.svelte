<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PhysicsEngine } from './lib/utils/PhysicsEngine';
  import { tasks } from './tasksStore';
  import { schedules } from './schedulesStore';

  let canvasEl: HTMLCanvasElement;
  let labelContainer: HTMLDivElement;
  let physicsEngine: PhysicsEngine;
  const gridSize = 16 * 4;

  export function collapseSelected() {
    physicsEngine?.collapseSelected();
  }

  export function expandSelected() {
    physicsEngine?.expandSelected();
  }

  onMount(() => {
    // canvas と labelContainer が揃ってから PhysicsEngine を作成
    if (canvasEl && labelContainer) {
      physicsEngine = new PhysicsEngine(canvasEl, labelContainer, gridSize);
    }

    const unsubscribeTasks = tasks.subscribe(taskList => {
      if (taskList && physicsEngine) physicsEngine.createBoxes(taskList);
    });

    const unsubscribeSchedules = schedules.subscribe(scheduleList => {
      if (scheduleList && physicsEngine) physicsEngine.createBoxes(scheduleList);
    });

    return () => {
      physicsEngine?.destroy();
      unsubscribeTasks();
      unsubscribeSchedules();
    };
  });
</script>

<canvas bind:this={canvasEl} style="position: absolute; top:0; left:0;"></canvas>
<div bind:this={labelContainer} style="position: absolute; top:0; left:0; width:100%; height:80vh;"></div>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 80vh;
    background: #fafafa;
    border: 1px solid #ccc;
  }

  div {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
