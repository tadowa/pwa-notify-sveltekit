export type NormalizedBox = {
  id: string;
  title: string;
  xGrid: number;  // 横軸グリッド位置
  yLane: number;  // ユーザー単位 + 重なりを考慮した縦位置
  wGrid: number;  // 横幅（グリッド単位）
};

export function normalizeBusySlots(
  users: UserBusy[],
  baseDate: Date,
  gridMinutes: number
): NormalizedBox[] {
  const result: NormalizedBox[] = [];

  users.forEach((user, userIndex) => {
    const lanes: Array<{ endGrid: number }>[] = []; // ユーザーごとのレーン管理

    user.busy.forEach((slot, index) => {
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);

      const startMinutes = (startTime.getTime() - baseDate.getTime()) / 60000;
      const endMinutes = (endTime.getTime() - baseDate.getTime()) / 60000;

      const startGrid = Math.floor(startMinutes / gridMinutes);
      const endGrid = Math.ceil(endMinutes / gridMinutes);

      // yLane を決定（重なりがある場合は新しいレーンに）
      let lane = 0;
      if (!lanes[userIndex]) lanes[userIndex] = [];
      while (lanes[userIndex][lane] && lanes[userIndex][lane].endGrid > startGrid) {
        lane++;
      }
      lanes[userIndex][lane] = { endGrid }; // レーンに追加

      result.push({
        id: `${user.user_id}_${index}`,
        title: user.name,
        xGrid: startGrid,
        yLane: lane + userIndex,
        wGrid: endGrid - startGrid,
      });
    });
  });

  return result;
}


export type PxBox = {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function toPxBoxes(
  normalized: NormalizedBox[],
  gridPixelWidth: number,
  gridPixelHeight: number
): PxBox[] {
  return normalized.map((box) => ({
    id: box.id,
    title: box.title,
    x: box.xGrid * gridPixelWidth + gridPixelWidth / 2, // Matter.js 中心座標
    y: box.yLane * gridPixelHeight + gridPixelHeight / 2,
    w: box.wGrid * gridPixelWidth,
    h: gridPixelHeight,
  }));
}
