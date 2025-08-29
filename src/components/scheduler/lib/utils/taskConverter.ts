// src/routes/scheduler/lib/utils/taskConverter.ts
import { Graph } from '@dagrejs/graphlib';

export type Node = {
  id: string;
  title: string;
};

export type Edge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
};

export type DbTask = {
  id: string;
  node_id: string;
  title: string;
  estimated_hours: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type MatterTask = {
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
  created_at?: string;
  updated_at?: string;
};

const GRID_SIZE = 16 * 4;   // 最小高さ
const HOUR_WIDTH = GRID_SIZE; // 1時間あたりの幅
const HORIZONTAL_SPACING = 0;
const VERTICAL_SPACING = 0;

/**
 * ノードとエッジ情報から2次元配列（列優先）を作る
 */
export function buildNodeIdGrid(nodes: Node[], edges: Edge[]): string[][] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adjMap = new Map<string, string[]>();
  const targetIds = new Set<string>();

  for (const edge of edges) {
    if (!adjMap.has(edge.source_node_id)) adjMap.set(edge.source_node_id, []);
    adjMap.get(edge.source_node_id)!.push(edge.target_node_id);
    targetIds.add(edge.target_node_id);
  }

  const rootNodes = nodes.filter(n => !targetIds.has(n.id));

  const result: string[][] = [];

  for (const root of rootNodes) {
    let currentLevelIds = [root.id];
    let isFirstInGroup = true;

    while (currentLevelIds.length > 0) {
      const nextLevelIds: string[] = [];

      for (const currentId of currentLevelIds) {
        const children = adjMap.get(currentId) || [];

        if (children.length > 0) {
          if (isFirstInGroup) {
            result.push([currentId, children[0]]);
            for (let i = 1; i < children.length; i++) {
              result.push(['', children[i]]);
            }
          } else {
            let found = false;
            for (let row of result) {
              if (row[row.length - 1] === currentId) {
                row.push(children[0]);
                found = true;
                break;
              }
            }
            if (found) {
              for (let i = 1; i < children.length; i++) {
                const newRow = Array(result[0].length - 1).fill('');
                newRow.push(children[i]);
                result.push(newRow);
              }
            }
          }
          nextLevelIds.push(...children);
        } else {
          if (isFirstInGroup) result.push([currentId]);
        }
      }

      currentLevelIds = nextLevelIds;
      isFirstInGroup = false;
    }
  }

  return result;
}


/**
 * 二次元配列のIDをタイトルに変換する
 * @param gridId 二次元配列 (nodeIdの配列)
 * @param nodes ノード情報 (id, title)
 * @returns 二次元配列 (title)
 */
export function convertGridIdToTitle(gridId: string[][], nodes: Node[]): string[][] {
  const idToTitle = new Map(nodes.map(n => [n.id, n.title]));
  return gridId.map(row => row.map(cellId => (cellId ? idToTitle.get(cellId) || '' : '')));
}

/**
 * 2次元配列 + DbTask情報から MatterTask を作る
 */
export function convert2DGridToMatterTasks(
  grid: string[][],
  dbTasks: DbTask[]
): MatterTask[] {
  const matterTasks: MatterTask[] = [];
  let groupCounter = 1;

  for (let col = 0; col < grid.length; col++) {
    const column = grid[col];

    for (let row = 0; row < column.length; row++) {
      const nodeId = column[row];
      if (!nodeId) continue;

      // node_idに紐づくタスクを取得
      const tasks = dbTasks.filter(t => t.node_id === nodeId);

      for (const t of tasks) {
        const w = Math.max((t.estimated_hours || 1) * HOUR_WIDTH, GRID_SIZE);
        const h = GRID_SIZE;

        matterTasks.push({
          id: t.id,
          x: row * (GRID_SIZE + HORIZONTAL_SPACING) + GRID_SIZE / 2, // 列番号ベース
          y: col * (GRID_SIZE + VERTICAL_SPACING) + GRID_SIZE / 2,   // 行番号ベース
          w,
          h,
          group_id: groupCounter,
          node_id: t.node_id,
          title: t.title,
          description: t.description,
          estimated_hours: t.estimated_hours,
          created_at: t.created_at,
          updated_at: t.updated_at
        });
      }
    }

    groupCounter++;
  }

  return matterTasks;
}
