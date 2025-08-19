<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  onMount(async () => {
    // URLパラメータのaccess_token等をSupabaseが自動処理
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.error('セッション取得失敗', error);
      goto('/login');
      return;
    }

    console.log('ログイン成功', session.user);
    goto('/notify');
  });
</script>

<p>ログイン処理中...</p>
