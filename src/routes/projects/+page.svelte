<script lang="ts">
  import { onMount } from 'svelte';
  let projects: { id: string; name: string; description: string }[] = [];

  onMount(async () => {
    const res = await fetch('/api/projects');
    projects = await res.json();
    console.log('projects:', projects); // ここで確認
  });
</script>

<h1 class="text-xl font-bold mb-4">Projects</h1>
<ul class="space-y-2">
  {#each projects as project}
    <li class="p-2 border rounded">
      <a href={`/projects/${project.id}`} class="text-blue-600 hover:underline">
        {project.title}
      </a>
      <p class="text-sm text-gray-600">{project.description}</p>
    </li>
  {/each}
</ul>
