import Matter from 'matter-js';
const { Bounds } = Matter;

export class SelectionHandler {
  public selectionRect: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
  private allBodies: Matter.Body[];

  constructor(allBodies: Matter.Body[]) {
    this.allBodies = allBodies;
  }

  // 新しいメソッドを追加
  public updateAllBodies(bodies: Matter.Body[]) {
    this.allBodies = bodies;
  }

  public getSelectionBounds(start: Matter.Vector, end: Matter.Vector) {
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    return { minX, minY, maxX, maxY };
  }

  public updateSelectedBodies(rect: { minX: number; minY: number; maxX: number; maxY: number }) {
    this.selectionRect = rect;
    return this.allBodies.filter(body => Bounds.overlaps(body.bounds, { min: { x: rect.minX, y: rect.minY }, max: { x: rect.maxX, y: rect.maxY } }));
  }

  public clearSelection() {
    this.selectionRect = null;
  }
}