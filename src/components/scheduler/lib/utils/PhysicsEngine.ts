import Matter from 'matter-js';
import { DragHandler } from './DragHandler';
import { SelectionHandler } from './SelectionHandler';
import { CustomRenderer } from './CustomRenderer';
import { MouseEventHandler, type MouseHandlers } from './MouseEventHandler';
import { GroupManager } from './GroupManager';
import { TaskLabelRenderer, type TaskLabel } from './TaskLabelRenderer';

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
  private taskLabelRenderer: TaskLabelRenderer;

  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private labelContainer: HTMLElement,
    private gridSize: number
  ) {
    if (!canvas || !labelContainer) {
      throw new Error('Canvas or labelContainer not provided to PhysicsEngine');
    }

    this.engine = Engine.create();
    this.engine.gravity.y = 0;

    this.render = Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: { wireframes: false, background: '#fafafa' }
    });
    Render.run(this.render);
    Runner.run(Runner.create(), this.engine);

    this.mouse = Mouse.create(this.canvas);
    (this.mouse as any).renderBounds = this.render.bounds;

    this.dragHandler = new DragHandler();
    this.selectionHandler = new SelectionHandler(this.boxes);
    this.customRenderer = new CustomRenderer(this.render, this.gridSize);
    this.groupManager = new GroupManager();
    this.taskLabelRenderer = new TaskLabelRenderer(this.labelContainer);

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

    // ラベル更新
    Events.on(this.render, 'afterRender', () => {
      const taskLabels: TaskLabel[] = this.boxes.map(box => ({
        id: box.id.toString(),
        text: box.plugin?.labelText ?? '',
        x: box.position.x,
        y: box.position.y
      }));

      this.taskLabelRenderer.setRenderBounds(this.render.bounds, this.canvasWidth, this.canvasHeight);
      this.taskLabelRenderer.update(taskLabels);
    });

    // 初期サイズ
    this.resizeCanvas();

    // ウィンドウリサイズ対応
    window.addEventListener('resize', this.resizeCanvas);
  }

  private resizeCanvas = () => {
    if (!this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.canvasWidth = width;
    this.canvasHeight = height;

    this.canvas.width = width;
    this.canvas.height = height;

    this.render.options.width = width;
    this.render.options.height = height;

    Render.lookAt(this.render, {
      min: { x: 0, y: 0 },
      max: { x: width, y: height }
    });

    // ラベルにサイズ更新を通知
    this.taskLabelRenderer.setRenderBounds(this.render.bounds, this.canvasWidth, this.canvasHeight);
  };

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
      }
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
    const bounds = this.render.bounds;
    const min = { x: bounds.min.x + dx, y: bounds.min.y + dy };
    const max = { x: bounds.max.x + dx, y: bounds.max.y + dy };
    Matter.Render.lookAt(this.render, { min, max });
  }

  public zoom(factor: number, center?: { x: number; y: number }) {
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
    window.removeEventListener('resize', this.resizeCanvas);
  }
}
