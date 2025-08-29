<script lang="ts">
  import { onMount } from 'svelte';
  import { Graph } from '@dagrejs/graphlib';
  import Scheduler from '../../../components/scheduler/Scheduler.svelte';
  import type { Task } from '../../../components/scheduler/stores';
  import { tasks, setTasksFromDB } from '../../../components/scheduler/stores';
  import { buildNodeIdGrid, convertGridIdToTitle, convert2DGridToMatterTasks } from '../../../components/scheduler/lib/utils/taskConverter';
  // import { parseGraphTo2DArray } from '../../../components/scheduler/lib/utils/nodeLayout';

  export let params;
  let project: any = null;
  let nodes: any[] = [];
  let edges: any[] = [];
  let graph: Graph;

  onMount(async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    const data = await res.json();
    project = data.project;
    nodes = data.nodes;
    edges = data.edges;

    // const parsedArray = parseGraphTo2DArray(nodes, edges);
    // console.log(JSON.stringify(parsedArray, null, 2));

    // 1. 2次元配列を作る
    const grid = buildNodeIdGrid(nodes, edges);
    console.log(grid);
    const titleGrid = convertGridIdToTitle(grid, nodes);
    console.log(titleGrid);

    // 2. それを使って MatterTask に変換
    const matterTasks = convert2DGridToMatterTasks(grid, data.tasks);
    console.log(matterTasks);

    // tasks を store にセット
    setTasksFromDB(matterTasks || []);

    // グラフ構築
    graph = new Graph({ directed: true });
    nodes.forEach(n => graph.setNode(n.id, n.title));
    edges.forEach(e => graph.setEdge(e.source_node_id, e.target_node_id));
  });
</script>

<Scheduler />

{#if project}
  <h1 class="text-xl font-bold mb-4">{project.title}</h1>
  <p class="mb-6">{project.description}</p>

  <h2 class="text-lg font-semibold">Nodes</h2>
  <ul class="mb-4 list-disc ml-5">
    {#each nodes as node}
      <li>id : {node.id} title : {node.title}</li>
    {/each}
  </ul>

  <h2 class="text-lg font-semibold">Edges</h2>
  <ul class="list-disc ml-5">
    {#each edges as edge}
      <li>source_node_id : {edge.source_node_id} → target_node_id : {edge.target_node_id}</li>
    {/each}
  </ul>
{/if}

{#if $tasks.length > 0}
  <h2 class="text-lg font-semibold mt-6">Tasks</h2>
  <ul class="mb-4 list-disc ml-5">
    {#each $tasks as task}
      <li>
        {task.node_id} {task.title} {task.estimated_hours},
      </li>
    {/each}
  </ul>
{/if}
