<script>
  import { createEventDispatcher } from 'svelte';

  export let selectedTask;
  const dispatch = createEventDispatcher();

  let selectedOptions = [];
  let options = [
    { id: 1, name: 'スキルA' },
    { id: 2, name: 'スキルB' },
    { id: 3, name: 'スキルC' },
  ];

  function closePanel() {
    dispatch('close');
  }

  function confirmSelection() {
    dispatch('confirm', { options: selectedOptions });
    closePanel();
  }
</script>

<div class="sidebar">
  <button class="close-btn" on:click={closePanel}>×</button>
  <h3>{selectedTask?.name || 'タスク'} - 担当者検索</h3>

  <div style="margin: 1rem 0;">
    <p>検索条件（仮）</p>
    {#each options as opt (opt.id)}
      <label style="display:block; margin-bottom:0.5rem;">
        <input type="checkbox" bind:group={selectedOptions} value={opt.name} />
        {opt.name}
      </label>
    {/each}
  </div>

  <button on:click={confirmSelection}>OK</button>
</div>

<style>
  .sidebar {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: 400px;
    max-height: 80%;
    background-color: #fff;
    border-left: 1px solid #e5e7eb;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2000;
    overflow-y: auto;
    border-radius: 12px 0 0 12px;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .close-btn {
    align-self: flex-end;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: #1f2937;
    padding: 0.5rem 1rem;
  }
  .close-btn:hover {
    color: #ef4444;
    background-color: #2563eb;
    border-radius: 6px;
    font-weight: 600;
  }
</style>