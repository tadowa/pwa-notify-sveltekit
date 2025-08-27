<script lang="ts">
  import { onMount } from 'svelte';
  import { Graph } from '@dagrejs/graphlib';

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

    // グラフ構築
    graph = new Graph({ directed: true });
    nodes.forEach(n => graph.setNode(n.id, n.title));
    edges.forEach(e => graph.setEdge(e.source_node_id, e.target_node_id));
  });
</script>

{#if project}
  <h1 class="text-xl font-bold mb-4">{project.name}</h1>
  <p class="mb-6">{project.description}</p>

  <h2 class="text-lg font-semibold">Nodes</h2>
  <ul class="mb-4 list-disc ml-5">
    {#each nodes as node}
      <li>{node.title}</li>
    {/each}
  </ul>

  <h2 class="text-lg font-semibold">Edges</h2>
  <ul class="list-disc ml-5">
    {#each edges as edge}
      <li>{edge.source_node_id} → {edge.target_node_id}</li>
    {/each}
  </ul>
{/if}
