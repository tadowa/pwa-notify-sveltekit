<!-- src\routes\projects\[id]\+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Graph } from '@dagrejs/graphlib';
  import Scheduler from '../../../components/scheduler/Scheduler.svelte';
  import type { Task } from '../../../components/scheduler/tasksStore';
  import { tasks, setTasksFromDB } from '../../../components/scheduler/tasksStore';
  import { buildNodeIdGrid, convertGridIdToTitle, convert2DGridToMatterTasks } from '../../../components/scheduler/lib/utils/taskConverter';

	import { supabase } from '$lib/supabaseClient';
	import { getAvailableUsersByTags } from '$lib/getAvailableUsers';
	import { getAvailableUsersByDays } from '$lib/getAvailableUsersByDays';
	import { getAvailableUsersBusySlots } from '$lib/getAvailableUsersBusySlots';
  
  import { normalizeBusySlots, toPxBoxes, type UserBusy } from '$lib/convertBusyBoxes';
  import { schedules, setSchedules } from '../../../components/scheduler/schedulesStore';

  export let params;
  let project: any = null;
  let nodes: any[] = [];
  let edges: any[] = [];
  let graph: Graph;

  onMount(async () => {
    aaaaaaaaaaaaa(params.id);
    bbbbbbbbbbbbbbb();
    ccccccccc();
  });

  async function aaaaaaaaaaaaa(id : string) {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    project = data.project;
    nodes = data.nodes;
    edges = data.edges;

    // 1. 2次元配列を作る
    const grid = buildNodeIdGrid(nodes, edges);
    console.log(grid);
    const titleGrid = convertGridIdToTitle(grid, nodes);
    console.log(titleGrid);

    // 2. それを使って MatterTask に変換
    const matterTasks = convert2DGridToMatterTasks(grid, data.tasks);
    console.log(matterTasks);

    // tasks を store にセット
    setTasksFromDB(matterTasks || []);

    // グラフ構築
    graph = new Graph({ directed: true });
    nodes.forEach(n => graph.setNode(n.id, n.title));
    edges.forEach(e => graph.setEdge(e.source_node_id, e.target_node_id));
  }


	let notifications: { id: string; message: string; created_at: string }[] = [];
	let newMessage = '';
	let user = null;
  let availableUsers: { user_id: string; name: string }[] = [];
  let availableUsersDays: { user_id: string; name: string }[] = [];

  let availableUsersBusySlots: UserBusy[] = [];  

  async function bbbbbbbbbbbbbbb() {
		await getUser();
		if (user) {
			await loadNotifications();
			subscribeNotifications();
		}
  }

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

  async function ccccccccc() {
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

		availableUsersBusySlots = await getAvailableUsersBusySlots(
			'2025-08-18 00:00',
			'2025-08-22 23:59',
			['土日OK', '第三土曜OK'], // タグ条件
			2,  // 1日あたり最小空き時間 (hours)
			3   // 期間内で最小空き日数
		);
		console.log(availableUsersBusySlots);

    const baseDate = new Date('2025-08-18');
    const normalized = normalizeBusySlots(availableUsersBusySlots, baseDate, 60*24);

    // Matter.js 用に px に変換
    const dayWidth = 16*4;
    const gridPixelHeight = dayWidth; // 1グリッド = 20px

    const pxBoxes = toPxBoxes(normalized, dayWidth, gridPixelHeight);
    // tasks を store にセット
    setSchedules(pxBoxes || []);

  }

  function goToProjects() {
    goto('/projects');
  }
  
  
</script>

<Scheduler />

{#if project}
  <h1 class="text-xl font-bold mb-4">{project.title}</h1>
  <p class="mb-6">{project.description}</p>

  <h2 class="text-lg font-semibold">Nodes</h2>
  <ul class="mb-4 list-disc ml-5">
    {#each nodes as node}
      <li>id : {node.id} title : {node.title}</li>
    {/each}
  </ul>

  <h2 class="text-lg font-semibold">Edges</h2>
  <ul class="list-disc ml-5">
    {#each edges as edge}
      <li>source_node_id : {edge.source_node_id} → target_node_id : {edge.target_node_id}</li>
    {/each}
  </ul>
{/if}

{#if $tasks.length > 0}
  <h2 class="text-lg font-semibold mt-6">Tasks</h2>
  <ul class="mb-4 list-disc ml-5">
    {#each $tasks as task}
      <li>
        {task.node_id} {task.title} {task.estimated_hours},
      </li>
    {/each}
  </ul>
{/if}

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

{#if availableUsersBusySlots.length > 0}
  <ul>
    {#each availableUsersBusySlots as user}
      <li>
        <strong>{user.name}</strong>
        <ul>
          {#each Object.entries(user.busy) as [day, slots]}
            <li>
              {day}: 
              {#if Array.isArray(slots)}
                {slots.map(slot => Array.isArray(slot) ? slot.join(' - ') : slot).join(', ')}
              {:else}
                {slots}
              {/if}
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
{:else}
  <p>空きユーザーは見つかりませんでした</p>
{/if}

