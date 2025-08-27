ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-- 既存関数があれば削除
DROP FUNCTION IF EXISTS get_available_users_by_time_and_tags(timestamptz, timestamptz, text[]);

CREATE OR REPLACE FUNCTION get_available_users_by_time_and_tags(
    start_interval timestamptz,
    end_interval timestamptz,
    tag_names text[],
    min_hours int DEFAULT -1
)
RETURNS TABLE (
    user_id uuid,
    name text
)
LANGUAGE sql
AS $$
WITH user_with_tags AS (
    -- タグ条件を満たすユーザーを抽出
    SELECT DISTINCT p.id, p.name
    FROM profiles p
    LEFT JOIN user_tags ut ON ut.user_id = p.id
    LEFT JOIN tags t ON t.id = ut.tag_id
    WHERE tag_names IS NULL OR t.name = ANY(tag_names)
),
busy AS (
    -- 指定範囲内にかかっている予定を切り出す
    SELECT
        s.user_id,
        GREATEST(s.start_time, start_interval) AS start_time,
        LEAST(s.end_time, end_interval) AS end_time
    FROM schedules s
    WHERE s.start_time < end_interval
      AND s.end_time   > start_interval
),
gaps AS (
    -- 予定と予定の隙間を計算（枠の端も含める）
    SELECT
        u.id AS user_id,
        u.name,
        gap_start,
        gap_end,
        EXTRACT(EPOCH FROM (gap_end - gap_start))/3600 AS gap_hours
    FROM user_with_tags u
    LEFT JOIN LATERAL (
        SELECT
            -- 直前予定の終了時刻 or 枠開始
            lag(end_time, 1, start_interval) OVER (PARTITION BY s.user_id ORDER BY s.start_time) AS gap_start,
            -- 次予定の開始時刻 or 枠終了
            LEAST(
                lead(start_time, 1, end_interval) OVER (PARTITION BY s.user_id ORDER BY s.start_time),
                end_interval
            ) AS gap_end
        FROM busy s
        WHERE s.user_id = u.id
    ) g ON true
)
SELECT DISTINCT user_id, name
FROM gaps
WHERE
    -- min_hours = -1 の場合は従来通り「空きがあるだけでOK」
    (min_hours < 0 AND gap_end > gap_start)
    OR
    -- min_hours >= 0 の場合は指定時間以上の空きがあるか
    (min_hours >= 0 AND gap_hours >= min_hours);
$$;




ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
不要な投入を検索（引数の型が違うとオーバーロードとなる）
SELECT p.proname AS function_name,
       n.nspname AS schema_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'get_available_users_by_time_and_tags';


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-- 型に合わせて不要な関数を削除
DROP FUNCTION IF EXISTS public.get_available_users_by_time_and_tags(
    _start_interval timestamp with time zone, 
    _end_interval timestamp with time zone, 
    _tag_names text[], 
    _min_hours double precision
);

DROP FUNCTION IF EXISTS public.get_available_users_by_time_and_tags(
    _start_interval timestamp with time zone, 
    _end_interval timestamp with time zone, 
    _tag_names text[], 
    _min_hours numeric
);


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
テストSQL
-- タグ条件あり
SELECT * FROM get_available_users_by_time_and_tags(
    '2025-08-20 09:00',
    '2025-08-20 12:00',
    ARRAY['土日OK', '第三土曜OK']
);

-- タグ条件なし（時間のみ）
SELECT * FROM get_available_users_by_time_and_tags(
    '2025-08-20 09:00',
    '2025-08-20 12:00',
    NULL
);







ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
CREATE OR REPLACE FUNCTION get_available_users_by_time_and_tags_with_days(
    start_date timestamptz,
    end_date timestamptz,
    tag_names text[],
    min_hours numeric,
    min_days integer
)
RETURNS TABLE (
    user_id uuid,
    name text,
    free_days integer
)
LANGUAGE sql
AS $$
WITH user_list AS (
    SELECT p.id, p.name
    FROM profiles p
    WHERE tag_names IS NULL
       OR EXISTS (
           SELECT 1
           FROM user_tags ut
           JOIN tags t ON ut.tag_id = t.id
           WHERE ut.user_id = p.id
             AND t.name = ANY(tag_names)
       )
),
dates AS (
    SELECT generate_series(start_date::date, end_date::date, interval '1 day') AS dt
),
daily_free AS (
    SELECT
        u.id AS user_id,
        d.dt,
        -- その日の空き時間を計算
        EXTRACT(EPOCH FROM (
            LEAST(end_date, COALESCE(MIN(s.start_time), end_date)) 
          - GREATEST(start_date, d.dt)
        )) / 3600 AS free_hours
    FROM user_list u
    CROSS JOIN dates d
    LEFT JOIN schedules s
      ON s.user_id = u.id
     AND s.start_time < d.dt + interval '1 day'
     AND s.end_time > d.dt
    GROUP BY u.id, d.dt
),
user_free_days AS (
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE free_hours >= min_hours) AS free_days
    FROM daily_free
    GROUP BY user_id
)
SELECT u.id, u.name, uf.free_days
FROM user_list u
JOIN user_free_days uf ON uf.user_id = u.id
WHERE uf.free_days >= min_days
ORDER BY u.name;
$$;



ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
SELECT p.proname AS function_name,
       n.nspname AS schema_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'get_available_users_by_time_and_tags_with_days';


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
テストSQL
-- 2025-08-18 から 2025-08-22 の間で、1日あたり 2時間以上空きがある日が 3日以上あるユーザー
SELECT * FROM get_available_users_by_time_and_tags_with_days(
  '2025-08-18 00:00',
  '2025-08-22 23:59',
  ARRAY['土日OK', '第三土曜OK'],
  2,
  3
);


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
1. Svelte のコンポーネント例


<script lang="ts">
  import { onMount } from 'svelte';
  import { getAvailableUsersByDays } from '$lib/api';
  let users: any[] = [];
  onMount(async () => {
    // 2025-08-18 ～ 2025-08-22 の期間で、1日あたり2時間以上空きがある日が3日以上あるユーザー
    users = await getAvailableUsersByDays(
      '2025-08-18 00:00',
      '2025-08-22 23:59',
      ['土日OK', '第三土曜OK'], // タグ条件
      2,  // 1日あたり最小空き時間 (hours)
      3   // 期間内で最小空き日数
    );
    console.log(users);
  });
</script>
<h2>条件を満たすユーザー</h2>
{#if users.length > 0}
  <ul>
    {#each users as user}
      <li>
        {user.name} (空き時間: {user.free_hours}h, {user.free_start} ～ {user.free_end})
      </li>
    {/each}
  </ul>
{:else}
  <p>該当ユーザーはいません。</p>
{/if}
2. 呼び出し例（ブラウザコンソール用）


import { getAvailableUsersByDays } from '$lib/api';
async function test() {
  const users = await getAvailableUsersByDays(
    '2025-08-18 00:00',
    '2025-08-22 23:59',
    ['土日OK', '第三土曜OK'],
    2,  // 1日あたり2時間以上
    3   // 3日以上空きがある
  );
  console.table(users);
}
test();
users 配列には、指定期間内で指定条件を満たすユーザーが返ります。

free_start / free_end / free_hours なども返すよう関数を設計している場合、それらを表示できます。

