// src/routes/scheduler/lib/utils/PhysicsEngine.ts
import Matter from 'matter-js';
import { DragHandler } from './DragHandler';
import { SelectionHandler } from './SelectionHandler';
import { CustomRenderer } from './CustomRenderer';
import { MouseEventHandler } from './MouseEventHandler';
import type { MouseHandlers } from './MouseEventHandler';
import { GroupManager } from './GroupManager';

const { Engine, Render, Runner, Bodies, Composite, Mouse, Events } = Matter;

export class PhysicsEngine {
  private engine: Matter.Engine;
  private render: Matter.Render;
  private mouse: Matter.Mouse;
  private boxes: Matter.Body[] = [];
  private selectedBodies: Matter.Body[] = [];

  private dragHandler: DragHandler;
  private selectionHandler: SelectionHandler;
  private customRenderer: CustomRenderer;
  private mouseEventHandler: MouseEventHandler;
  private groupManager: GroupManager;

  private scale: number = 1; // ズーム倍率

  constructor(canvas: HTMLCanvasElement, width: number, height: number, gridSize: number) {
    this.engine = Engine.create();
    this.engine.gravity.y = 0;

    this.render = Render.create({
      canvas,
      engine: this.engine,
      options: { width, height, wireframes: false, background: '#fafafa' }
    });
    Render.run(this.render);
    Runner.run(Runner.create(), this.engine);

    this.mouse = Mouse.create(canvas);

    this.dragHandler = new DragHandler();
    this.selectionHandler = new SelectionHandler(this.boxes);
    this.customRenderer = new CustomRenderer(this.render, gridSize);
    this.groupManager = new GroupManager();

    const handlers: MouseHandlers = {
      onSelectionChange: this.handleSelectionChange,
      onScroll: (dx, dy) => this.scroll(dx, dy),
      onZoom: (factor, center) => this.zoom(factor, center)
    };

    this.mouseEventHandler = new MouseEventHandler(
      this.mouse,
      this.boxes,
      this.dragHandler,
      this.selectionHandler,
      this.customRenderer,
      this.handleSelectionChange,
      handlers
    );

    // --- ボックス上に文字を描画 ---
    Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const box of this.boxes) {
        if (box.plugin?.labelText) {
          ctx.fillStyle = this.selectedBodies.includes(box) ? '#2ecc71' : 'black';
          ctx.fillText(box.plugin.labelText, box.position.x, box.position.y);
        }
      }
    });
  }

  public createBoxes(tasks: { id: string; title: string; x: number; y: number; w: number; h: number; group_id?: number }[]) {
    const newBoxes = tasks.map(task => Bodies.rectangle(task.x, task.y, task.w, task.h, {
      frictionAir: 0.2,
      restitution: 0,
      inertia: Infinity,
      render: { fillStyle: '#3498db' },
      label: String(task.title),
      plugin: { group_id: task.group_id, labelText: task.title },
      collisionFilter: {
        group: task.group_id ?? 0,
        category: 0x0001,
        mask: 0xFFFFFFFF
      },
    }));

    this.boxes = [...this.boxes, ...newBoxes];
    Composite.add(this.engine.world, newBoxes);

    this.mouseEventHandler.updateBoxList(this.boxes);
    this.selectionHandler.updateAllBodies(this.boxes);
    this.handleSelectionChange(this.selectedBodies);
  }

  public collapseSelected() {
    this.groupManager.collapse(this.selectedBodies);
    this.updateBoxColors();
  }

  public expandSelected() {
    this.groupManager.expand(this.selectedBodies);
    this.updateBoxColors();
  }

  private handleSelectionChange = (selectedBodies: Matter.Body[]) => {
    this.selectedBodies = selectedBodies;
    this.mouseEventHandler.updateSelectedBodies(selectedBodies);
    this.updateBoxColors();
    // CustomRenderer の選択矩形は PhysicsEngine 側で反映する場合もある
    // ここでは MouseEventHandler が描画通知を持つなら不要
  };

  private updateBoxColors() {
    for (const box of this.boxes) {
      const inCollapsed = Array.from(this.groupManager.getCollapsedGroups().values())
        .some(g => g.master === box || g.children.includes(box));

      if (this.selectedBodies.includes(box)) {
        box.render.fillStyle = '#2ecc71';
      } else if (inCollapsed) {
        const g = Array.from(this.groupManager.getCollapsedGroups().values())
          .find(g => g.master === box || g.children.includes(box));
        if (g) box.render.fillStyle = g.master === box ? '#2980b9' : '#9b59b6';
      } else {
        box.render.fillStyle = '#3498db';
      }
    }
  }

  public scroll(dx: number, dy: number) {
    Matter.Bounds.translate(this.render.bounds, { x: dx, y: dy });
    Matter.Render.lookAt(this.render, this.render.bounds);
  }

  public zoom(factor: number, center?: { x: number; y: number }) {
    this.scale *= factor;
    const bounds = this.render.bounds;
    const cx = center?.x ?? (bounds.min.x + bounds.max.x) / 2;
    const cy = center?.y ?? (bounds.min.y + bounds.max.y) / 2;

    const minX = cx + (bounds.min.x - cx) / factor;
    const minY = cy + (bounds.min.y - cy) / factor;
    const maxX = cx + (bounds.max.x - cx) / factor;
    const maxY = cy + (bounds.max.y - cy) / factor;

    bounds.min.x = minX;
    bounds.min.y = minY;
    bounds.max.x = maxX;
    bounds.max.y = maxY;

    Matter.Render.lookAt(this.render, bounds);
  }

  public destroy() {
    Render.stop(this.render);
    Matter.Engine.clear(this.engine);
    this.mouseEventHandler.destroy();
  }
}
