import { writable } from 'svelte/store';

export type Task = {
  id: number;
  name: string;
  start: number;
  duration: number;
  groupId: number;
};

export const tasks = writable<Task[]>([
  { id: 1, name: 'タスクA', start: 0, duration: 2, groupId: 1 },
  { id: 2, name: 'タスクB', start: 1, duration: 3, groupId: 2 },
  { id: 3, name: 'タスクC', start: 3, duration: 1, groupId: 3 },
  { id: 4, name: 'タスクD', start: 4, duration: 1, groupId: 4 },
  { id: 5, name: 'タスクE', start: 5, duration: 3, groupId: 5 },
  { id: 6, name: 'タスクF', start: 6, duration: 2, groupId: 6 }
]);
