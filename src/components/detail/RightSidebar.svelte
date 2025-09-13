<script lang="ts">
  import { resources } from '../scheduler/resourcesStore';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  
  import SearchOverlay from '../search/SearchOverlay.svelte';
  import DetailsPanel from './DetailsPanel.svelte';
  import SettingsPanel from './SettingsPanel.svelte';

  export let selectedTask = null;
  const dispatch = createEventDispatcher();

  let searchQuery = '';
  let filteredItems = [];
  let items = [
    { id: 1, name: 'アイテムA' },
    { id: 2, name: 'アイテムB' },
    { id: 3, name: 'アイテムC' },
    { id: 4, name: 'アイテムD' },
    { id: 5, name: 'アイテムE' },
  ];

  let searchOptions = {};
  let showOverlay = false;

  $: filterItems();

  function filterItems() {
    let result = items;
    if (searchQuery) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (searchOptions.skills?.length) {
      result = result.filter(item =>
        searchOptions.skills.some(skill => item.name.includes(skill))
      );
    }
    filteredItems = result;
  }

  function handleSelectItem(item) {
    dispatch('itemSelect', item);
  }

  function openSearchOptions() {
    showOverlay = true;
  }

  function handleOverlayConfirm(e) {
    searchOptions = e.detail.options;
    showOverlay = false;
    filterItems();
  }

  let collapsed = false;
  function toggleCollapse() {
    collapsed = !collapsed;
  }

  // タブ管理
  let activeTab = 'search'; // 'search' | 'details' | 'etc'
  let isSidebarTabLocked = false; 

  // 入れ子サイドバー
  let nestedPanel = null; 
  function openNested(type) {
    nestedPanel = type;
    isSidebarTabLocked = true; 
  }
  function closeNested() {
    nestedPanel = null;
    isSidebarTabLocked = false; 
  }

  // 検索オーバーレイのイベントハンドラ
  function handleSearchOverlayClose() {
    showOverlay = false;
    isSidebarTabLocked = false; 
  }
  function handleSearchOverlayConfirmEvent(e) {
    handleOverlayConfirm(e);
    isSidebarTabLocked = false; 
  }

  // 💡 DetailsPanel と SettingsPanel のイベントハンドラを追加
  function handleDetailsConfirm(e) {
    console.log("DetailsPanelからデータを受信:", e.detail.data);
    closeNested();
  }

  function handleSettingsConfirm(e) {
    console.log("SettingsPanelからデータを受信:", e.detail.data);
    closeNested();
  }
</script>

<button class="collapse-btn" on:click={toggleCollapse}>
  {#if collapsed}▶{:else}◀{/if}
</button>

<div class="sidebar" class:collapsed={collapsed} transition:fly={{ x: 400, duration: 300 }}>
  <div class="tabs">
    <button on:click={() => (activeTab = 'search')} class:active={activeTab === 'search'} disabled={isSidebarTabLocked}>🔍</button>
    <button on:click={() => (activeTab = 'details')} class:active={activeTab === 'details'} disabled={isSidebarTabLocked}>📄</button>
    <button on:click={() => (activeTab = 'etc')} class:active={activeTab === 'etc'} disabled={isSidebarTabLocked}>⚙</button>
  </div>

  <div class="content">
    {#if activeTab === 'search'}
      <h2>検索パネル</h2>
      <button on:click={() => { openSearchOptions(); isSidebarTabLocked = true; }}>検索条件を設定</button>
      {#if resources}
        <div class="search-box">
          <input
            type="text"
            bind:value={searchQuery}
            on:input={filterItems}
            placeholder="検索ワードを入力..."
          />
        </div>

        {#if filteredItems.length > 0}
          <ul class="results-list">
            {#each filteredItems as item (item.id)}
              <li on:click={() => handleSelectItem(item)}>{item.name}</li>
            {/each}
          </ul>
        {:else}
          <p class="no-results">検索結果がありません</p>
        {/if}

        <div class="selected-item">現在の検索ワード: {searchQuery}</div>
      {:else}
        <p class="text-center text-gray-500 italic">検索対象を選択してください</p>
      {/if}
    {:else if activeTab === 'details'}
      <h2>詳細タブ</h2>
      <p>タスク詳細情報表示</p>
      <button on:click={() => openNested('subDetails')}>子サイドバーを開く</button>
    {:else}
      <h2>その他設定</h2>
      <button on:click={() => openNested('settings')}>設定パネルを開く</button>
    {/if}
  </div>
</div>

{#if nestedPanel === 'subDetails'}
  <DetailsPanel on:confirm={handleDetailsConfirm} on:close={closeNested} />
{:else if nestedPanel === 'settings'}
  <SettingsPanel on:confirm={handleSettingsConfirm} on:close={closeNested} />
{/if}

{#if showOverlay}
  <SearchOverlay
    on:confirm={handleSearchOverlayConfirmEvent}
    on:close={handleSearchOverlayClose}
  />
{/if}

<style>
.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 25%;
  min-width: 280px;
  background-color: #f9fafb;
  border-left: 1px solid #e5e7eb;
  display: flex;
  z-index: 1000;
  border-radius: 12px 0 0 12px;
  transform: translateX(0);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.sidebar.collapsed {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

.tabs {
  width: 50px;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d1d5db;
}

.tabs button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
}
.tabs button.active {
  background: #e5e7eb;
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.results-list li {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
}
.results-list li:hover {
  background-color: #f3f4f6;
}

.no-results {
  color: #6b7280;
  text-align: center;
  font-style: italic;
}

.selected-item {
  padding: 0.5rem;
  background-color: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
}

.collapse-btn {
  position: fixed;
  right: 0;
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