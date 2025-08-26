import Matter from 'matter-js';
const { Events } = Matter;

export class CustomRenderer {
  private render: Matter.Render;
  private gridSize: number;
  private selectionRect: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  constructor(render: Matter.Render, gridSize: number) {
    this.render = render;
    this.gridSize = gridSize;
    Events.on(this.render, 'afterRender', () => this.draw());
  }

  public setSelectionRect(rect: { minX: number; minY: number; maxX: number; maxY: number } | null) {
    this.selectionRect = rect;
  }

  private draw() {
    const ctx = this.render.context;
    const width = this.render.options.width;
    const height = this.render.options.height;

    // グリッドの描画
    ctx.strokeStyle = '#eee';
    for (let x = 0; x <= width; x += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // 選択範囲の描画
    if (this.selectionRect) {
      const { minX, minY, maxX, maxY } = this.selectionRect;
      ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.8)';
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }
}