<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  let email = '';

  async function signIn() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 認証後に必ずこのURLに飛ぶ
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Magic Linkを送信しました。メールを確認してください。');
    }
  }
</script>

<input bind:value={email} placeholder="メールアドレス" type="email" />
<button on:click={signIn}>ログイン</button>
