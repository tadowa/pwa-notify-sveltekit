<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { getAvailableUsersByTags } from '$lib/getAvailableUsers';
	import { getAvailableUsersByDays } from '$lib/getAvailableUsersByDays';
	import { goto } from '$app/navigation';

	let notifications: { id: string; message: string; created_at: string }[] = [];
	let newMessage = '';
	let user = null;
  	let availableUsers: { user_id: string; name: string }[] = [];
  	let availableUsersDays: { user_id: string; name: string }[] = [];

	// ユーザー取得
	async function getUser() {
		const { data, error } = await supabase.auth.getUser();
		console.log('getUser data:', data, 'error:', error);
		if (error) {
			console.error('ユーザー取得エラー', error);
			user = null;
		} else {
			user = data.user;
		}
	}

	// 通知送信
	async function sendNotification() {
        console.log('user id:', user?.id);

		if (!newMessage.trim()) return;

		const { data, error } = await supabase
			.from('notifications')
			.insert([
				{
					message: newMessage,
					sender_id: user?.id
				}
			]);

		console.log('sendNotification data:', data, 'error:', error);
		if (error) console.error('送信エラー', error);
		else newMessage = '';
	}

	// 通知一覧取得
	async function loadNotifications() {
		const { data, error } = await supabase
			.from('notifications')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(20);

		console.log('loadNotifications data:', data, 'error:', error);
		if (!error && data) notifications = data;
	}

	// リアルタイム購読
    function subscribeNotifications() {
    console.log('subscribeNotifications 呼び出し');
    const channel = supabase
        .channel('public:notifications')
        .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
            console.log('新着通知 payload:', payload);
            notifications = [payload.new, ...notifications];
        }
        );

    channel.subscribe();
    }


	onMount(async () => {
		await getUser();
		if (user) {
			await loadNotifications();
			subscribeNotifications();
		}

		availableUsers = await getAvailableUsersByTags(
			'2025-08-20 09:00',
			'2025-08-20 13:00',
			['土日OK', '第三土曜OK'],
			2
		);
		console.log(availableUsers);

		availableUsersDays = await getAvailableUsersByDays(
			'2025-08-18 00:00',
			'2025-08-22 23:59',
			['土日OK', '第三土曜OK'], // タグ条件
			2,  // 1日あたり最小空き時間 (hours)
			3   // 期間内で最小空き日数
		);
		console.log(availableUsersDays);
	});


	function goToAbout() {
		goto('/scheduler');
	}

</script>

<h1>通知テストページ</h1>

{#if user}
	<p>ログイン中: {user.email}</p>
	<div style="margin-bottom: 1rem;">
		<input bind:value={newMessage} placeholder="通知メッセージ" />
		<button on:click={sendNotification}>送信</button>
	</div>

	<ul>
		{#each notifications as n}
			<li>{new Date(n.created_at).toLocaleTimeString()}: {n.message}</li>
		{/each}
	</ul>
{:else}
	<p>ログインしてください。</p>
{/if}

{#if availableUsers.length > 0}
  <ul>
    {#each availableUsers as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{:else}
  <p>空きユーザーは見つかりませんでした</p>
{/if}

{#if availableUsersDays.length > 0}
  <ul>
    {#each availableUsersDays as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{:else}
  <p>空きユーザーは見つかりませんでした</p>
{/if}

<button on:click={goToAbout}>Aboutへ移動</button>
