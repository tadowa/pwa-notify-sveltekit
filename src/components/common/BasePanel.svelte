<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  const dispatch = createEventDispatcher();

  function closePanel() {
    dispatch('close');
  }
</script>

<div class="base-panel" transition:fly={{ x: 400, duration: 300 }}>
  <button class="close-btn" on:click={closePanel}>×</button>

  <slot></slot>
</div>

<style>
  .base-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: 400px;
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
</style>