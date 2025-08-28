// src\routes\scheduler\lib\utils\DragHandler.ts
import Matter from 'matter-js';
const { Body } = Matter;

export class DragHandler {
  private dragOffsetMap = new Map<Matter.Body, Matter.Vector>();

  public startDrag(selectedBodies: Matter.Body[], mousePosition: Matter.Vector) {
    this.dragOffsetMap.clear();
    for (const body of selectedBodies) {
      this.dragOffsetMap.set(body, { x: mousePosition.x - body.position.x, y: mousePosition.y - body.position.y });
    }
  }

  public applyDragPosition(selectedBodies: Matter.Body[], mousePosition: Matter.Vector) {
    if (selectedBodies.length === 0) return;

    for (const body of selectedBodies) {
      const offset = this.dragOffsetMap.get(body);
      if (!offset) continue;
      Body.setPosition(body, { x: mousePosition.x - offset.x, y: mousePosition.y - offset.y });
    }
  }
}