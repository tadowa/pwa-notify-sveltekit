// src/components/scheduler/stores.ts
import { writable } from 'svelte/store';

export type Task = {
  id: string;
  title: string;
  start: number;
  duration: number;
  groupId: number;

  node_id?: string;
  description?: string;
  estimated_hours?: number;
  created_at?: string;
  updated_at?: string;
};

export const tasks = writable<Task[]>([]);

// DB から取得した tasks を store にセット
export function setTasksFromDB(dbTasks: any[], baseHours: number) {
  tasks.set(
    dbTasks.map((t, i) => ({
      id: t.id,
      title: t.title,
      start: i,
      // duration: t.estimated_hours * (baseHours || 1),
      duration: t.estimated_hours * 100,
      groupId: i + 1,
      node_id: t.node_id,
      description: t.description,
      estimated_hours: t.estimated_hours,
      created_at: t.created_at,
      updated_at: t.updated_at
    }))
  );
}
