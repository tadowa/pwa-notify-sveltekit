// src\components\scheduler\schedulesStore.ts
import { writable } from 'svelte/store';

export type Schedule = {
  id: string;
  title: string;
  x: number;   // Matter.js 中心座標
  y: number;   // Matter.js 中心座標
  w: number;
  h: number;
  group_id?: number;
};

// スケジューラー用 store
export const schedules = writable<Schedule[]>([]);

/**
 * DB や変換済みのスケジューラーボックスを store にセット
 */
export function setSchedules(srcSchedules: Schedule[]) {
  schedules.set(
    srcSchedules.map((b) => ({
      id: b.id,
      title: b.title,
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      group_id: b.group_id
    }))
  );
}
