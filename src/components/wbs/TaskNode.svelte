<script>
  import { createEventDispatcher } from 'svelte';
  import TaskNode from './TaskNode.svelte'; // 再帰用に import
  export let task;
  const dispatch = createEventDispatcher();

  function selectTask() {
    dispatch('taskSelect', task);
  }

  function handleChildSelect(event) {
    dispatch('taskSelect', event.detail);
  }
</script>

<div style="margin-left:10px;">
  <button class="task" type="button" on:click={selectTask}>
    {task.name}
  </button>

  {#if task.children}
    <div class="children" style="padding-left:20px;">
      {#each task.children as child}
        <TaskNode task={child} on:taskSelect={handleChildSelect} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .task {
    cursor:pointer;
    padding:2px 0;
    border:none;
    background:none;
    text-align:left;
  }
</style>
