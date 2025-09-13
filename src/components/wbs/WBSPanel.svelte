<script>
  import TaskNode from './TaskNode.svelte';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let collapsed = false; // パネル開閉状態

  let tasks = [
    { id:1, name:'基礎工事', children:[ {id:2,name:'掘削'}, {id:3,name:'鉄筋工事'} ] },
    { id:4, name:'上棟工事', children:[ {id:5,name:'柱建て'}, {id:6,name:'梁架け'} ] }
  ];

  function handleTaskSelect(task) {
    dispatch('taskSelect', task);
  }

  function toggleCollapse() {
    collapsed = !collapsed;
  }
</script>

<!-- パネル本体 -->
<div class="sidebar" class:collapsed={collapsed}>
  <div class="task-list">
    {#each tasks as task}
      <TaskNode task={task} on:taskSelect={handleTaskSelect} />
    {/each}
  </div>
</div>

<!-- 開閉ボタン（パネル外に固定） -->
<button class="collapse-btn" type="button" on:click={toggleCollapse}>
  {#if collapsed}▶{:else}◀{/if}
</button>

<style>
/* パネル本体 */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 280px;
  background-color: #f9fafb;
  border-right: 1px solid #e5e7eb;
  /* padding: 2rem; */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 1000;
  overflow: hidden;
  border-radius: 0 12px 12px 0;
  transition: width 0.3s ease, padding 0.3s ease, border 0.3s ease;
}

/* 折りたたみ状態 */
.sidebar.collapsed {
  width: 0;
  padding: 0;
  border: none;
}

/* タスクリスト */
.task-list {
  opacity: 1;
  transition: opacity 0.2s ease;
}

.sidebar.collapsed .task-list {
  opacity: 0;          /* 中身は透明にして押し上げを防止 */
  pointer-events: none; /* 閉じた時にクリックできないように */
}

/* 開閉ボタン（パネル外で固定） */
.collapse-btn {
  position: fixed;
  left: 0;
  top: 1rem;
  width: 40px;
  height: 40px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}
</style>
