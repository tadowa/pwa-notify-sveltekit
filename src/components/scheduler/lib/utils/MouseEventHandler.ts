// src\components\scheduler\lib\utils\MouseEventHandler.ts
import Matter from 'matter-js';
import { DragHandler } from './DragHandler';
import { SelectionHandler } from './SelectionHandler';
import { CustomRenderer } from './CustomRenderer';

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
  private customRenderer: CustomRenderer;
  private onSelectionChange: (selectedBodies: Matter.Body[]) => void;
  private handlers: MouseHandlers;

  constructor(
    mouse: Matter.Mouse,
    boxes: Matter.Body[],
    dragHandler: DragHandler,
    selectionHandler: SelectionHandler,
    customRenderer: CustomRenderer,
    onSelectionChange: (selectedBodies: Matter.Body[]) => void,
    handlers: MouseHandlers
  ) {
    this.mouse = mouse;
    this.boxes = boxes;
    this.dragHandler = dragHandler;
    this.selectionHandler = selectionHandler;
    this.customRenderer = customRenderer;
    this.onSelectionChange = onSelectionChange;
    this.handlers = handlers;

    this.setupEvents();
  }

  private setupEvents() {
    this.mouse.element.addEventListener('mousedown', this.handleMouseDown);
    this.mouse.element.addEventListener('mousemove', this.handleMouseMove);
    this.mouse.element.addEventListener('mouseup', this.handleMouseUp);
    this.mouse.element.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  // Canvas座標 → ワールド座標に変換
  private getWorldPosition(pos: Matter.Vector, bounds: Matter.Bounds) {
    return {
      x: pos.x + bounds.min.x,
      y: pos.y + bounds.min.y
    };
  }

  private handleMouseDown = (event: MouseEvent) => {
    const bounds = (this.mouse as any).renderBounds as Matter.Bounds; 
    const worldPos = this.getWorldPosition(this.mouse.position, bounds);

    this.dragStart = { ...worldPos };
    const clickedBody = this.boxes.find(b => Matter.Bounds.contains(b.bounds, worldPos));

    if (clickedBody) {
      if (this.selectedBodies.includes(clickedBody)) {
        this.isDragging = true;
        this.dragHandler.startDrag(this.selectedBodies, worldPos);
      } else {
        this.selectedBodies = [clickedBody];
        this.handlers.onSelectionChange?.(this.selectedBodies);
        this.isDragging = true;
        this.dragHandler.startDrag(this.selectedBodies, worldPos);
      }
    } else {
      // オブジェクトがクリックされなかった場合は、選択を解除し、範囲選択を開始
      this.onSelectionChange([]);
      this.selectedBodies = [];
      this.handlers.onSelectionChange?.(this.selectedBodies);
      this.isDragging = false;
    }
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.dragStart) return;

    const bounds = (this.mouse as any).renderBounds as Matter.Bounds;
    const worldPos = this.getWorldPosition(this.mouse.position, bounds);

    if (this.isDragging) {
      this.dragHandler.applyDragPosition(this.selectedBodies, worldPos);
    } else {
      const rect = this.selectionHandler.getSelectionBounds(this.dragStart, worldPos);
      const selected = this.selectionHandler.updateSelectedBodies(rect);
      this.customRenderer.setSelectionRect(rect);
      this.onSelectionChange(selected);
      this.handlers.onSelectionChange?.(selected);
    }
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    this.dragStart = null;
  this.customRenderer.setSelectionRect(null);
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
