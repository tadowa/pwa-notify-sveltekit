<script lang="ts">
  import { onMount } from 'svelte';
  import Matter from 'matter-js';
  const { Engine, Render, Runner, Bodies, Composite, Events, Body, Mouse, Bounds } = Matter;
  import { tasks } from './stores';

  interface Task {
    id: number;
    name: string;
    start: number;
    duration: number;
  }

  let canvasEl: HTMLCanvasElement;
  let engine: Matter.Engine;
  let render: Matter.Render;
  let boxes: Matter.Body[] = [];

  let selectedBodies: Matter.Body[] = [];
  let isDragging = false;
  let dragStart: Matter.Vector | null = null;
  let isSelecting = false;
  let selectionRect: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  const gridSize = 80;

  // 畳み込みグループ情報
  let collapsedGroups = new Map<number, {
    master: Matter.Body,
    children: Matter.Body[],
    groupId: number,
    prePositions: { body: Matter.Body, x: number, y: number }[]
  }>();

  // box の色更新
  export function updateBoxColors() {
    for (const box of boxes) {
      const inCollapsed = Array.from(collapsedGroups.values()).some(g => g.master === box || g.children.includes(box));
      if (selectedBodies.includes(box)) {
        box.render.fillStyle = '#2ecc71';
      } else if (inCollapsed) {
        const g = Array.from(collapsedGroups.values()).find(g => g.master === box || g.children.includes(box))!;
        box.render.fillStyle = g.master === box ? '#2980b9' : '#9b59b6';
      } else {
        box.render.fillStyle = '#3498db';
      }
    }
  }

  // 畳み込み
// 親要素（左上の要素）と相対位置を保存
let groupParent: Matter.Body | null = null;
let groupOffsets: Map<Matter.Body, {dx: number, dy: number}> = new Map();

export function collapseSelected() {
  if (!selectedBodies.length) return;

  // 親は左上の要素
  groupParent = selectedBodies.reduce((min, b) => {
    const minX = min.position.x + min.bounds.min.x;
    const minY = min.position.y + min.bounds.min.y;
    const curX = b.position.x + b.bounds.min.x;
    const curY = b.position.y + b.bounds.min.y;
    return (curY < minY || (curY === minY && curX < minX)) ? b : min;
  }, selectedBodies[0]);

  groupOffsets.clear();

  const parentY = groupParent.position.y;

  // 衝突無効化用の group を作成（負の値は「同じ group 内で絶対に衝突しない」）
  const groupId = -Date.now();

  selectedBodies.forEach(body => {
    // 相対位置を保存
    groupOffsets.set(body, {
      dx: body.position.x - groupParent!.position.x,
      dy: body.position.y - groupParent!.position.y,
    });

    // Y座標を親に揃える
    Matter.Body.setPosition(body, {
      x: body.position.x,
      y: parentY,
    });

    // 動きを止める
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(body, 0);

    // 同グループは衝突しないよう設定
    body.collisionFilter.group = groupId;

    (body as any).isCollapsed = true;
  });

  (groupParent as any).isGroupParent = true;
}


export function expandSelected() {
  if (!groupParent) return;

  groupOffsets.forEach((offset, body) => {
    Matter.Body.setPosition(body, {
      x: groupParent!.position.x + offset.dx,
      y: groupParent!.position.y + offset.dy,
    });
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(body, 0);

    // 衝突判定を復活
    body.collisionFilter.group = 0;

    (body as any).isCollapsed = false;
  });

  (groupParent as any).isGroupParent = false;
  groupParent = null;
  groupOffsets.clear();
}



  onMount(() => {
    engine = Engine.create();
    engine.gravity.y = 0;
    const width = 1400;
    const height = 900;

    render = Render.create({
      canvas: canvasEl,
      engine,
      options: { width, height, wireframes: false, background: '#fafafa' }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine);

    tasks.subscribe(taskList => {
      Composite.clear(engine.world, false, true);
      boxes = [];
      for (let task of taskList) {
        const x = task.start * gridSize + (task.duration * gridSize) / 2;
        const y = task.id * gridSize + gridSize / 2;
        const box = Bodies.rectangle(x, y, task.duration * gridSize, gridSize, {
          frictionAir: 0.2,
          restitution: 0,
          inertia: Infinity,
          render: { fillStyle: '#3498db' },
          label: String(task.id),
          plugin: { groupId: task.groupId },
        });
        boxes.push(box);
        Composite.add(engine.world, box);
      }
    });

    const mouse = Mouse.create(render.canvas);
    const dragOffsetMap = new Map<Matter.Body, Matter.Vector>();

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

    const drawOverlay = () => {
      const ctx = render.context;
      ctx.strokeStyle = '#eee';
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      if (selectionRect) {
        const { minX, minY, maxX, maxY } = selectionRect;
        ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.8)';
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      }
    };
    Events.on(render, 'afterRender', drawOverlay);

    const applyDragPosition = (pos: Matter.Vector) => {
      if (!isDragging || selectedBodies.length === 0) return;
      for (const body of selectedBodies) {
        const offset = dragOffsetMap.get(body);
        if (!offset) continue;
        Body.setPosition(body, { x: pos.x - offset.x, y: pos.y - offset.y });

        // 畳み込み中の children を追従
        collapsedGroups.forEach(g => {
          if (g.master === body) {
            for (const child of g.children) {
              Body.setPosition(child, { x: pos.x - offset.x, y: child.position.y });
            }
          }
        });
      }
    };

    render.canvas.addEventListener('mousedown', () => {
      const pos = mouse.position;
      dragStart = { ...pos };
      const clickedBody = boxes.find(b => Bounds.contains(b.bounds, pos));
      if (clickedBody) {
        if (!selectedBodies.includes(clickedBody)) selectedBodies = [clickedBody];
        dragOffsetMap.clear();
        for (const body of selectedBodies) {
          dragOffsetMap.set(body, { x: pos.x - body.position.x, y: pos.y - body.position.y });
        }
        updateBoxColors();
        isDragging = true;
        selectionRect = null;
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
      if (isDragging && selectedBodies.length > 0) {
        applyDragPosition(pos);
      }
    });

    render.canvas.addEventListener('mouseup', () => {
      isDragging = false;
      isSelecting = false;
      dragStart = null;
      selectionRect = null;
      updateBoxColors();
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
