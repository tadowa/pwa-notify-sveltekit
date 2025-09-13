<script>
  import BasePanel from '../common/BasePanel.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function closePanel() {
    dispatch('close');
  }

  function confirmSelection() {
    // 例として、ダミーのデータを返す
    dispatch('confirm', { data: '設定パネルのデータ' });
    closePanel();
  }
</script>

<BasePanel on:close={closePanel}>
  <h3>設定パネル</h3>
  <p>ユーザー設定、表示オプションなど。</p>
  <p>ここに設定項目用のフォームやUIを配置します。</p>
  <button on:click={confirmSelection}>OK</button>
</BasePanel>