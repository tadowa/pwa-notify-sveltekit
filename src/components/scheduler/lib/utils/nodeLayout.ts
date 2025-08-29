/**
 * ノードとエッジのデータを解析し、2次元配列に変換します。
 *
 * @param {Array<Object>} nodes - ノードの配列
 * @param {Array<Object>} edges - エッジの配列
 * @returns {Array<Array<string>>} - 変換された2次元配列
 */
export function parseGraphTo2DArrayById(nodes, edges) {
  // ノードIDからノード自体へのマッピング
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // ソースノードからターゲットノードの配列へのマッピング
  const adjMap = new Map();
  const targetIds = new Set();

  for (const edge of edges) {
    const source = edge.source_node_id;
    const target = edge.target_node_id;

    if (!adjMap.has(source)) adjMap.set(source, []);
    adjMap.get(source).push(target);
    targetIds.add(target);
  }

  // ルートノード（親を持たないノード）
  const rootNodes = nodes.filter(node => !targetIds.has(node.id));

  const result = [];

  for (const rootNode of rootNodes) {
    let currentLevelIds = [rootNode.id];
    let isFirstInGroup = true;

    while (currentLevelIds.length > 0) {
      const nextLevelIds = [];

      for (const currentId of currentLevelIds) {
        const dependencies = adjMap.get(currentId) || [];

        if (dependencies.length > 0) {
          if (isFirstInGroup) {
            result.push([currentId, dependencies[0]]);
            for (let i = 1; i < dependencies.length; i++) {
              result.push(['', dependencies[i]]);
            }
          } else {
            let foundRow = false;
            for (let row of result) {
              if (row[row.length - 1] === currentId) {
                row.push(dependencies[0]);
                foundRow = true;
                break;
              }
            }
            if (foundRow) {
              for (let i = 1; i < dependencies.length; i++) {
                const newRow = Array(result[0].length - 1).fill('');
                newRow.push(dependencies[i]);
                result.push(newRow);
              }
            }
          }
          nextLevelIds.push(...dependencies);
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
