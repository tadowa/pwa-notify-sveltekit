import { supabase } from '$lib/supabaseClient';

/**
 * 空き時間＋タグ条件でユーザーを取得
 * @param start 開始日時（ISO文字列）
 * @param end 終了日時（ISO文字列）
 * @param tags タグ名の配列
 * @param minHours タグ名の配列
 * @returns ユーザー配列 [{ user_id, name }]
 */
export async function getAvailableUsersByTags(
  start: string,
  end: string,
  tags: string[] | null,
  minHours: number = -1
) {
  try {
    // const { data: { session } } = await supabase.auth.getSession();
    // console.log(session);

{
// SELECT * FROM get_available_users_by_time_and_tags(
//   '2025-08-20 09:00',
//   '2025-08-20 13:00',
//   ARRAY['土日OK', '第三土曜OK'],
//   2
// );
}
{
// ISO形式でZ付きUTCに変換
const startISO = new Date('2025-08-20T11:15:00Z').toISOString();
const endISO   = new Date('2025-08-20T12:45:00Z').toISOString();

const { data, error } = await supabase.rpc('get_available_users_by_time_and_tags', {
  _start_interval: startISO,
  _end_interval: endISO,
  _tag_names: ['土日OK', '第三土曜OK'],  // タグ無しの場合は null
  _min_hours: 1
});

console.log({ data, error });  
}
 {
    const { data, error } = await supabase.rpc('get_available_users_by_time_and_tags', {
        start_interval: '2025-08-21 09:00:00',
        end_interval: '2025-08-21 17:00:00',
        tag_names: ['土日OK', '第三土曜OK'],
        min_hours: minHours,
    });
    console.log({ data, error });
}
    const { data, error } = await supabase.rpc('get_available_users_by_time_and_tags', {
      start_interval: start,
      end_interval: end,
      tag_names: tags,  // JS配列そのまま渡す
      min_hours: minHours,
    });
 
    if (error) {
      console.error('RPC error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}
