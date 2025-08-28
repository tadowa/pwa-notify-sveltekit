// src\routes\scheduler\lib\utils\GroupManager.ts
import Matter from 'matter-js';

// 畳み込みグループ情報
interface CollapsedGroup {
  master: Matter.Body;
  children: Matter.Body[];
  groupId: number;
  prePositions: { body: Matter.Body; x: number; y: number }[];
}

export class GroupManager {
  private collapsedGroups = new Map<number, CollapsedGroup>();

  public collapse(selectedBodies: Matter.Body[]) {
    if (selectedBodies.length < 2) return;

    const master = selectedBodies.reduce((min, b) => {
      const minX = min.position.x + min.bounds.min.x;
      const minY = min.position.y + min.bounds.min.y;
      const curX = b.position.x + b.bounds.min.x;
      const curY = b.position.y + b.bounds.min.y;
      return (curY < minY || (curY === minY && curX < minX)) ? b : min;
    }, selectedBodies[0]);

    const groupId = Date.now();
    const prePositions = selectedBodies.map(body => ({ body, x: body.position.x, y: body.position.y }));

    this.collapsedGroups.set(groupId, {
      master,
      children: selectedBodies.filter(b => b !== master),
      groupId,
      prePositions,
    });

    const masterY = master.position.y;
    selectedBodies.forEach(body => {
      Matter.Body.setPosition(body, { x: body.position.x, y: masterY });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      body.collisionFilter.group = -groupId;
      (body as any).isCollapsed = true;
      if (body === master) (body as any).isGroupMaster = true;
    });
  }

  public expand(selectedBodies: Matter.Body[]) {
    const body = selectedBodies[0];
    if (!body || !(body as any).isCollapsed) return;

    let groupToExpand: CollapsedGroup | undefined;
    for (const group of this.collapsedGroups.values()) {
      if (group.children.includes(body) || group.master === body) {
        groupToExpand = group;
        break;
      }
    }

    if (!groupToExpand) return;

    // マスターオブジェクトの元の位置と現在の位置の差分を計算
    const masterOriginalPos = groupToExpand.prePositions.find(p => p.body === groupToExpand.master);
    const deltaX = groupToExpand.master.position.x - (masterOriginalPos?.x ?? 0);
    const deltaY = groupToExpand.master.position.y - (masterOriginalPos?.y ?? 0);

    // 各オブジェクトを元の位置からの相対的な差分を考慮して配置する
    groupToExpand.prePositions.forEach(p => {
      const targetBody = p.body;
      Matter.Body.setPosition(targetBody, { x: p.x + deltaX, y: p.y + deltaY });
      Matter.Body.setVelocity(targetBody, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(targetBody, 0);
      targetBody.collisionFilter.group = 0;
      (targetBody as any).isCollapsed = false;
      (targetBody as any).isGroupMaster = false;
    });
    
    this.collapsedGroups.delete(groupToExpand.groupId);
  }

  public getCollapsedGroups() {
    return this.collapsedGroups;
  }
}