<script>
    import { resources } from './resourcesStore';

    import { slide } from 'svelte/transition';
    import { fly } from 'svelte/transition';

    let searchQuery = '';
    let filteredItems = [];
    let items = [
        { id: 1, name: 'アイテムA' },
        { id: 2, name: 'アイテムB' },
        { id: 3, name: 'アイテムC' },
        { id: 4, name: 'アイテムD' },
        { id: 5, name: 'アイテムE' },
    ];

    // ストアが変更されたときに検索を実行
    $: {
        if (resources) {
            // searchQuery = $selectedElement;
            filterItems();
        }
    }

    // 検索フィルタリング
    function filterItems() {
        if (searchQuery) {
            filteredItems = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            filteredItems = items;
        }
    }

    function handleSelectItem(item) {
        // ここで選択したアイテムの情報をストアに再度反映
        // $selectedElement = item.name;
    }


</script>

<style>
    .sidebar {
        position: fixed;
        right: 0;
        top: 0;
        height: 100vh;
        width: 25%;          /* 画面の1/4 */
        min-width: 280px;    /* モバイル対策 */
        background-color: #f9fafb;
        border-left: 1px solid #e5e7eb;
        padding: 2rem;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        border-radius: 12px 0 0 12px;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        z-index: 1000; /* 前面に出す */
    }
    .sidebar.visible {
        transform: translateX(0);
    }
    h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        text-align: center;
    }
    .search-box {
        position: relative;
    }
    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        background-color: #fff;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .results-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .results-list li {
        background-color: #fff;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .results-list li:hover {
        background-color: #f3f4f6;
        transform: translateY(-2px);
    }
    .no-results {
        text-align: center;
        color: #6b7280;
        padding: 2rem;
        font-style: italic;
    }
    .selected-item {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #eef2ff;
        border: 1px solid #c7d2fe;
        border-radius: 8px;
        font-weight: 600;
        color: #4338ca;
        text-align: center;
        transition: all 0.3s ease-in-out;
    }
</style>

<div class="sidebar" class:visible={resources !== null} transition:fly={{ x: 300, duration: 500, delay: 500 }}>
    <h2>Search Panel</h2>
    {#if resources}
        <div class="search-box">
            <input
                type="text"
                bind:value={searchQuery}
                on:input={filterItems}
                placeholder="Search for items..."
                class="rounded-lg p-2 border"
            />
        </div>
        {#if filteredItems.length > 0}
            <ul class="results-list">
                {#each filteredItems as item (item.id)}
                    <li on:click={() => handleSelectItem(item)}>
                        {item.name}
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="no-results">No results found.</p>
        {/if}
        <div class="selected-item">
            Currently selected: {searchQuery}
        </div>
    {:else}
        <p class="text-center text-gray-500 italic">Select a Matter.js element to begin.</p>
    {/if}
</div>
