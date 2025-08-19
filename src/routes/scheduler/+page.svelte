<script lang="ts">
  import { onMount } from 'svelte';
  import Matter from 'matter-js';
  import { writable } from 'svelte/store';

  let canvasEl: HTMLCanvasElement;

  // タスクデータ（例）
  let tasks = writable([
    { id: 1, name: 'タスクA', start: 0, duration: 2 },
    { id: 2, name: 'タスクB', start: 1, duration: 3 },
    { id: 3, name: 'タスクC', start: 3, duration: 1 },
    { id: 4, name: 'タスクC', start: 4, duration: 1 },
    { id: 5, name: 'タスクC', start: 5, duration: 3 },
    { id: 6, name: 'タスクC', start: 6, duration: 2 }
  ]);

  let boxes: Matter.Body[] = [];
  let engine: Matter.Engine;
  let render: Matter.Render;

  let selectedBodies: Matter.Body[] = [];
  let isDragging = false;
  let dragStart: Matter.Vector | null = null;
  let dragLast: Matter.Vector | null = null;
  let isSelecting = false;
  let selectionRect: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  const gridSize = 80; // 1セル = 1時間とか任意設定
  let savedPositions = new Map<number, { start: number; duration: number }>();

  onMount(() => {
    const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, Vector, Body, Bounds } = Matter;

    engine = Engine.create();
    engine.gravity.y = 0;
    const world = engine.world;

    const width = 1400;
    const height = 900;

    render = Render.create({
      canvas: canvasEl,
      engine,
      options: { width, height, wireframes: false, background: '#fafafa' }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine);

    // タスクからボックス作成
    tasks.subscribe((taskList) => {
      Composite.clear(world, false, true);
      boxes = [];
      for (let task of taskList) {
        // 初期配置はそのまま
        const x = task.start * gridSize + (task.duration * gridSize) / 2;
        const y = task.id * gridSize + gridSize / 2;
        const box = Bodies.rectangle(x, y, task.duration * gridSize, gridSize, {
          frictionAir: 0.2,
          restitution: 0,
          inertia: Infinity,
          render: { fillStyle: '#3498db' },
          label: String(task.id)
        });
        boxes.push(box);
        Composite.add(world, box);
      }
    });

    const mouse = Mouse.create(render.canvas);

    const getSelectionBounds = (start: Matter.Vector, end: Matter.Vector) => {
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxX = Math.max(start.x, end.x);
      const maxY = Math.max(start.y, end.y);
      return { minX, minY, maxX, maxY };
    };

    const isInSelection = (body: Matter.Body, minX: number, minY: number, maxX: number, maxY: number) => {
      const { min, max } = body.bounds;
      return max.x >= minX && min.x <= maxX && max.y >= minY && min.y <= maxY;
    };

    const updateBoxColors = () => {
      for (const box of boxes) {
        box.render.fillStyle = selectedBodies.includes(box) ? '#2ecc71' : '#3498db';
      }
    };

    const drawOverlay = () => {
      const ctx = render.context;
      ctx.strokeStyle = '#eee';
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      if (isSelecting && selectionRect) {
        const { minX, minY, maxX, maxY } = selectionRect;
        ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.8)';
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      }
    };

    Events.on(render, 'afterRender', drawOverlay);

    const applyDragVelocity = (current: Matter.Vector) => {
      if (!isDragging || selectedBodies.length === 0 || !dragLast) return;
      const delta = Vector.sub(current, dragLast);
      for (const body of selectedBodies) {
        Body.setVelocity(body, { x: delta.x, y: delta.y });
        Body.setAngularVelocity(body, 0);
      }
      dragLast = { ...current };
    };

    const snapToGrid = (body: Matter.Body) => {
      const width = body.bounds.max.x - body.bounds.min.x;
      const height = body.bounds.max.y - body.bounds.min.y;

      let newLeft = Math.round((body.position.x - width / 2) / gridSize) * gridSize;
      let newTop = Math.round((body.position.y - height / 2) / gridSize) * gridSize;

      const canvasWidth = render.options.width;
      const canvasHeight = render.options.height;
      newLeft = Math.max(0, Math.min(newLeft, canvasWidth - width));
      newTop = Math.max(0, Math.min(newTop, canvasHeight - height));

      Body.setPosition(body, { x: newLeft + width / 2, y: newTop + height / 2 });
    };

    render.canvas.addEventListener('mousedown', () => {
      const pos = mouse.position;
      dragStart = { ...pos };
      dragLast = { ...pos };
      const clickedBody = boxes.find(b => Bounds.contains(b.bounds, pos));
      if (clickedBody) {
        if (!selectedBodies.includes(clickedBody)) selectedBodies = [clickedBody];
        updateBoxColors();
        isDragging = true;
        return;
      }
      selectedBodies = [];
      updateBoxColors();
      isSelecting = true;
      selectionRect = null;
    });

    render.canvas.addEventListener('mousemove', () => {
      const pos = mouse.position;
      if (isSelecting && dragStart) {
        selectionRect = getSelectionBounds(dragStart, pos);
        const { minX, minY, maxX, maxY } = selectionRect;
        selectedBodies = boxes.filter(b => isInSelection(b, minX, minY, maxX, maxY));
        updateBoxColors();
      }
      if (!isDragging && selectedBodies.length > 0 && dragStart && !isSelecting) {
        isDragging = true;
        dragLast = { ...pos };
      }
      applyDragVelocity(pos);
    });

    render.canvas.addEventListener('mouseup', () => {
      isDragging = false;
      isSelecting = false;
      dragStart = null;
      dragLast = null;
      selectionRect = null;
//      for (let body of selectedBodies) snapToGrid(body);
      // 選択中のボックスを強制スナップ
      for (let body of selectedBodies) {
        // 少し遅延させると確実にスナップされる
        setTimeout(() => snapToGrid(body), 0);
      }

      updateBoxColors();
    });

    const snapTimers = new Map();
    Events.on(engine, 'afterUpdate', () => {
      const now = Date.now();
      for (const body of boxes) {
        if (selectedBodies.includes(body)) continue;
        const isSlow = body.speed < 0.1;
        if (isSlow) {
          const last = snapTimers.get(body) ?? now;
          if (now - last > 1000) {
            snapToGrid(body);
            body.angle = 0;
            body.angularVelocity = 0;
            snapTimers.delete(body);
          } else snapTimers.set(body, last);
        } else snapTimers.set(body, now);
      }
    });
  });

  function savePositions() {
    tasks.update(tList => {
      const updated = tList.map(task => {
        const box = boxes.find(b => b.label === String(task.id));
        if (!box) return task;
        const newStart = Math.round((box.position.x - (box.bounds.max.x - box.bounds.min.x)/2)/gridSize);
        const newDuration = Math.round((box.bounds.max.x - box.bounds.min.x)/gridSize);
        savedPositions.set(task.id, { start: newStart, duration: newDuration });
        return { ...task, start: newStart, duration: newDuration };
      });
      return updated;
    });
    alert('保存しました');
  }

  function requestTask(taskId: number) {
    alert(`タスク${taskId}を依頼しました`);
  }
</script>

<canvas bind:this={canvasEl}></canvas>

<div class="controls">
  <button on:click={savePositions}>保存</button>
  {#each $tasks as task (task.id)}
    <button on:click={() => requestTask(task.id)}>依頼: {task.name}</button>
  {/each}
</div>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 80vh;
    background: #fafafa;
    border: 1px solid #ccc;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
  }
  button {
    padding: 4px 8px;
    background: #3498db;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background: #2c80b4;
  }
</style>
