<script>
  import BasePanel from '../common/BasePanel.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function closePanel() {
    dispatch('close');
  }

  function confirmSelection() {
    // 例として、ダミーのデータを返す
    dispatch('confirm', { data: '詳細パネルのデータ' });
    closePanel();
  }
</script>

<BasePanel on:close={closePanel}>
  <h3>詳細パネル</h3>
  <p>タスクの詳細情報</p>
  <p>ここに詳細なUIコンポーネントを配置します。</p>
  <button on:click={confirmSelection}>OK</button>
</BasePanel>