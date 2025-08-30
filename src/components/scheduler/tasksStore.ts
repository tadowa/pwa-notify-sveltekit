// src\components\scheduler\tasksStore.ts
import { writable } from 'svelte/store';

export type Task = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  group_id: number;

  node_id?: string;
  title: string;
  description?: string;
  estimated_hours?: number;
};

export const tasks = writable<Task[]>([]);

// DB から取得した tasks を store にセット
export function setTasksFromDB(srcTasks: Task[]) {
  tasks.set(
    srcTasks.map((t, i) => ({
      id: t.id,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      group_id: t.group_id,
      node_id: t.node_id,
      title: t.title,
      description: t.description,
      estimated_hours: t.estimated_hours,
    }))
  );
}
