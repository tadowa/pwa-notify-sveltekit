import Matter from 'matter-js';
import { DragHandler } from './DragHandler';
import { SelectionHandler } from './SelectionHandler';
import { CustomRenderer } from './CustomRenderer';
import { MouseEventHandler } from './MouseEventHandler';
import { GroupManager } from './GroupManager';

const { Engine, Render, Runner, Bodies, Composite, Mouse } = Matter;

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

    // MouseEventHandlerに状態更新のコールバックを渡す
    this.mouseEventHandler = new MouseEventHandler(
      this.mouse,
      this.boxes,
      this.dragHandler,
      this.selectionHandler,
      this.customRenderer,
      this.handleSelectionChange
    );
  }

// src/routes/scheduler/lib/PhysicsEngine.ts

  public createBoxes(tasks: { id: number; start: number; duration: number; groupId?: number }[]) {
    Composite.clear(this.engine.world, false, true);
    const gridSize = 80;
    this.boxes = tasks.map(task => {
      const x = task.start * gridSize + (task.duration * gridSize) / 2;
      const y = task.id * gridSize + gridSize / 2;
      return Bodies.rectangle(x, y, task.duration * gridSize, gridSize, {
        frictionAir: 0.2,
        restitution: 0,
        inertia: Infinity,
        render: { fillStyle: '#3498db' },
        label: String(task.id),
        plugin: { groupId: task.groupId },
      });
    });
    Composite.add(this.engine.world, this.boxes);
    // 新しいボックスリストをハンドラに通知
    this.mouseEventHandler.updateBoxList(this.boxes);
    // SelectionHandlerにも新しいボックスリストを更新するメソッドを追加
    this.selectionHandler.updateAllBodies(this.boxes); // ← この行を追加
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
    // MouseEventHandlerにも選択状態を同期させる
    this.mouseEventHandler.updateSelectedBodies(selectedBodies);
    this.updateBoxColors();
  };

  private updateBoxColors() {
    for (const box of this.boxes) {
      const inCollapsed = Array.from(this.groupManager.getCollapsedGroups().values()).some(g => g.master === box || g.children.includes(box));
      if (this.selectedBodies.includes(box)) {
        box.render.fillStyle = '#2ecc71';
      } else if (inCollapsed) {
        const g = Array.from(this.groupManager.getCollapsedGroups().values()).find(g => g.master === box || g.children.includes(box));
        if (g) box.render.fillStyle = g.master === box ? '#2980b9' : '#9b59b6';
      } else {
        box.render.fillStyle = '#3498db';
      }
    }
  }
  
  public destroy() {
    Render.stop(this.render);
    Runner.stop(this.engine);
    Matter.Engine.clear(this.engine);
    this.mouse.element.removeEventListener('mousedown', this.mouseEventHandler['handleMouseDown']);
    this.mouse.element.removeEventListener('mousemove', this.mouseEventHandler['handleMouseMove']);
    this.mouse.element.removeEventListener('mouseup', this.mouseEventHandler['handleMouseUp']);
  }
}