// src\components\scheduler\lib\utils\TaskLabelRenderer.ts
export type TaskLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export class TaskLabelRenderer {
  private container: HTMLElement;
  private labels: Map<string, HTMLDivElement> = new Map();
  private taskData: TaskLabel[] = [];
  private renderBounds: Matter.Bounds = { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } };
  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.style.position = 'relative';
    this.container.style.pointerEvents = 'none';
  }

  /** bounds と canvas サイズを更新 */
  public setRenderBounds(bounds: Matter.Bounds, canvasWidth: number, canvasHeight: number) {
    this.renderBounds = bounds;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /** タスクデータを更新して描画 */
  public update(taskData: TaskLabel[]) {
    this.taskData = taskData;
    this.render();
  }

  private render() {
    const visibleIds = new Set<string>();

    for (const task of this.taskData) {
      const screenX = ((task.x - this.renderBounds.min.x) / (this.renderBounds.max.x - this.renderBounds.min.x)) * this.canvasWidth;
      const screenY = ((task.y - this.renderBounds.min.y) / (this.renderBounds.max.y - this.renderBounds.min.y)) * this.canvasHeight;

      if (screenX < 0 || screenY < 0 || screenX > this.canvasWidth || screenY > this.canvasHeight) continue;

      visibleIds.add(task.id);

      let labelEl = this.labels.get(task.id);
      if (!labelEl) {
        labelEl = document.createElement('div');
        labelEl.style.position = 'absolute';
        labelEl.style.whiteSpace = 'nowrap';
        labelEl.style.fontSize = '12px';
        labelEl.style.fontFamily = 'sans-serif';
        labelEl.style.color = '#000';
        labelEl.style.transform = 'translate(-50%, -50%)';
        this.container.appendChild(labelEl);
        this.labels.set(task.id, labelEl);
      }

      labelEl.textContent = task.text;
      labelEl.style.left = `${screenX}px`;
      labelEl.style.top = `${screenY}px`;
      labelEl.style.display = 'block';
    }

    // 画面外になったラベルは非表示
    for (const [id, el] of this.labels) {
      if (!visibleIds.has(id)) el.style.display = 'none';
    }
  }
}
