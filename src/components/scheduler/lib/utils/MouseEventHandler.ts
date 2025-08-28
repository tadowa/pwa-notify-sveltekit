// src\routes\scheduler\lib\utils\MouseEventHandler.ts
import Matter from 'matter-js';
import { DragHandler } from './DragHandler';
import { SelectionHandler } from './SelectionHandler';
import { CustomRenderer } from './CustomRenderer';

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

  constructor(
    mouse: Matter.Mouse,
    boxes: Matter.Body[],
    dragHandler: DragHandler,
    selectionHandler: SelectionHandler,
    customRenderer: CustomRenderer,
    onSelectionChange: (selectedBodies: Matter.Body[]) => void
  ) {
    this.mouse = mouse;
    this.boxes = boxes;
    this.dragHandler = dragHandler;
    this.selectionHandler = selectionHandler;
    this.customRenderer = customRenderer;
    this.onSelectionChange = onSelectionChange;

    this.setupEvents();
  }

  private setupEvents() {
    this.mouse.element.addEventListener('mousedown', this.handleMouseDown);
    this.mouse.element.addEventListener('mousemove', this.handleMouseMove);
    this.mouse.element.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleMouseDown = () => {
    const pos = this.mouse.position;
    this.dragStart = { ...pos };

    // クリックされたオブジェクトを特定
    const clickedBody = this.boxes.find(b => Matter.Bounds.contains(b.bounds, pos));

    if (clickedBody) {
        // クリックされた要素がすでに選択範囲に含まれているかチェック
        if (this.selectedBodies.includes(clickedBody)) {
        // 含まれている場合は、選択状態を維持してドラッグを開始
        this.isDragging = true;
        this.dragHandler.startDrag(this.selectedBodies, pos);
        } else {
        // 含まれていない場合は、その要素を単体で選択し、ドラッグを開始
        this.onSelectionChange([clickedBody]);
        this.isDragging = true;
        this.dragHandler.startDrag(this.selectedBodies, pos);
        }
    } else {
        // オブジェクトがクリックされなかった場合は、選択を解除し、範囲選択を開始
        this.onSelectionChange([]);
        this.isDragging = false;
    }
  };



  private handleMouseMove = () => {
    const pos = this.mouse.position;

    if (!this.dragStart) return;

    if (this.isDragging) {
      // ドラッグ操作中
      this.dragHandler.applyDragPosition(this.selectedBodies, pos);
    } else {
      // 範囲選択中
      const rect = this.selectionHandler.getSelectionBounds(this.dragStart, pos);
      const selected = this.selectionHandler.updateSelectedBodies(rect);
      this.customRenderer.setSelectionRect(rect);
      this.onSelectionChange(selected);
    }
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    this.dragStart = null;
    this.customRenderer.setSelectionRect(null);
  };

  public updateBoxList(boxes: Matter.Body[]) {
    this.boxes = boxes;
    this.selectionHandler.updateAllBodies(boxes);
  }

  public updateSelectedBodies(selectedBodies: Matter.Body[]) {
    this.selectedBodies = selectedBodies;
  }
}