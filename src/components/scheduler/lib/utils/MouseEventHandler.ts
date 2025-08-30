// src/routes/scheduler/lib/utils/MouseEventHandler.ts
import Matter from 'matter-js';
import { DragHandler } from './DragHandler';
import { SelectionHandler } from './SelectionHandler';

export type MouseHandlers = {
  onSelectionChange?: (selectedBodies: Matter.Body[]) => void;
  onScroll?: (dx: number, dy: number) => void;
  onZoom?: (factor: number, center?: { x: number; y: number }) => void;
};

export class MouseEventHandler {
  private mouse: Matter.Mouse;
  private boxes: Matter.Body[];
  private selectedBodies: Matter.Body[] = [];
  private dragStart: Matter.Vector | null = null;
  private isDragging = false;

  private dragHandler: DragHandler;
  private selectionHandler: SelectionHandler;
  private handlers: MouseHandlers;

  constructor(
    mouse: Matter.Mouse,
    boxes: Matter.Body[],
    dragHandler: DragHandler,
    selectionHandler: SelectionHandler,
    handlers: MouseHandlers
  ) {
    this.mouse = mouse;
    this.boxes = boxes;
    this.dragHandler = dragHandler;
    this.selectionHandler = selectionHandler;
    this.handlers = handlers;

    this.setupEvents();
  }

  private setupEvents() {
    this.mouse.element.addEventListener('mousedown', this.handleMouseDown);
    this.mouse.element.addEventListener('mousemove', this.handleMouseMove);
    this.mouse.element.addEventListener('mouseup', this.handleMouseUp);

    // ホイール操作
    this.mouse.element.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  private handleMouseDown = () => {
    const pos = this.mouse.position;
    this.dragStart = { ...pos };

    const clickedBody = this.boxes.find(b => Matter.Bounds.contains(b.bounds, pos));

    if (clickedBody) {
      if (this.selectedBodies.includes(clickedBody)) {
        this.isDragging = true;
        this.dragHandler.startDrag(this.selectedBodies, pos);
      } else {
        this.selectedBodies = [clickedBody];
        this.handlers.onSelectionChange?.(this.selectedBodies);
        this.isDragging = true;
        this.dragHandler.startDrag(this.selectedBodies, pos);
      }
    } else {
      this.selectedBodies = [];
      this.handlers.onSelectionChange?.(this.selectedBodies);
      this.isDragging = false;
    }
  };

  private handleMouseMove = () => {
    const pos = this.mouse.position;
    if (!this.dragStart) return;

    if (this.isDragging) {
      this.dragHandler.applyDragPosition(this.selectedBodies, pos);
    } else {
      const rect = this.selectionHandler.getSelectionBounds(this.dragStart, pos);
      const selected = this.selectionHandler.updateSelectedBodies(rect);
      this.handlers.onSelectionChange?.(selected);
    }
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    this.dragStart = null;
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    const deltaX = e.deltaX;
    const deltaY = e.deltaY;

    if (e.shiftKey) {
      const factor = deltaY < 0 ? 1.1 : 0.9;
      this.handlers.onZoom?.(factor, { x: e.offsetX, y: e.offsetY });
    } else {
      this.handlers.onScroll?.(-deltaX, -deltaY);
    }
  };

  public updateBoxList(boxes: Matter.Body[]) {
    this.boxes = boxes;
    this.selectionHandler.updateAllBodies(boxes);
  }

  public updateSelectedBodies(selectedBodies: Matter.Body[]) {
    this.selectedBodies = selectedBodies;
  }

  public destroy() {
    this.mouse.element.removeEventListener('mousedown', this.handleMouseDown);
    this.mouse.element.removeEventListener('mousemove', this.handleMouseMove);
    this.mouse.element.removeEventListener('mouseup', this.handleMouseUp);
    this.mouse.element.removeEventListener('wheel', this.handleWheel);
  }
}
