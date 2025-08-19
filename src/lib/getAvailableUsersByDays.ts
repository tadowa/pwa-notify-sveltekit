import { supabase } from '$lib/supabaseClient';

export async function getAvailableUsersByDays(
  startDate: string,
  endDate: string,
  tags: string[] | null,
  minHours: number,
  minDays: number
) {
  const { data, error } = await supabase.rpc(
    'get_available_users_by_time_and_tags_with_days',
    {
      start_date: startDate,
      end_date: endDate,
      tag_names: tags,
      min_hours: minHours,
      min_days: minDays
    }
  );

  if (error) {
    console.error('Error fetching available users:', error);
    return [];
  }
  return data;
}

// -- 2025-08-18 から 2025-08-22 の間で、1日あたり 2時間以上空きがある日が 3日以上あるユーザー
// SELECT * FROM get_available_users_by_time_and_tags_with_days(
//   '2025-08-18 00:00',
//   '2025-08-22 23:59',
//   ARRAY['土日OK', '第三土曜OK'],
//   2,
//   3
// );
