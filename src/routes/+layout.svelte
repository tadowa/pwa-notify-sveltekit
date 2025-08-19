<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let user = null;

  onMount(async () => {
    const { data } = await supabase.auth.getUser();
    user = data.user;

    supabase.auth.onAuthStateChange((_event, session) => {
      user = session?.user ?? null;
      if (!user && $page.url.pathname !== '/login') {
        goto('/login');
      }
    });

    if (!user && $page.url.pathname !== '/login') {
      goto('/login');
    } else if (user && $page.url.pathname === '/') {
      goto('/notify');
    }
  });

  async function signOut() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<header>
  {#if user}
    <span>ログイン中: {user.email}</span>
    <button on:click={signOut}>ログアウト</button>
  {/if}
</header>

<slot />
