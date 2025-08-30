import { supabase } from '$lib/supabaseClient';

/**
 * 1スロットの開始・終了
 */
export type BusySlot = {
  start: string; // ISO 形式
  end: string;
};

/**
 * ユーザーごとの busy スロット
 */
export type UserBusy = {
  user_id: string;
  name: string;
  busy: BusySlot[]; // 単純に配列で保持
};

/**
 * 指定期間・タグ・条件に合うユーザーの busy スロットを取得
 * @param startDate 'YYYY-MM-DD HH:MM' 形式の開始日時
 * @param endDate 'YYYY-MM-DD HH:MM' 形式の終了日時
 * @param tags タグ名の配列（null でタグ無視）
 * @param minHours 1日あたりの最低空き時間（hours）
 * @param minDays 対象期間内で空きがある日数の最低値
 * @returns busy 情報を持つユーザーの配列
 */
export async function getAvailableUsersBusySlots(
  startDate: string,
  endDate: string,
  tags: string[] | null,
  minHours: number,
  minDays: number
): Promise<UserBusy[]> {
  const { data, error } = await supabase.rpc('get_available_users_busy_slots', {
    start_date: startDate,
    end_date: endDate,
    tag_names: tags,
    min_hours: minHours,
    min_days: minDays
  });

  if (error) {
    console.error('Error fetching available users:', error);
    return [];
  }

  // 型安全に変換
  return (data as any[]).map((u) => ({
    user_id: u.user_id,
    name: u.name,
    busy: Array.isArray(u.busy)
      ? u.busy.map((slot: any) => ({
          start: slot.start,
          end: slot.end
        }))
      : []
  }));
}


// 使用例
// const users = await getAvailableUsersBusySlots(
//   '2025-08-18 00:00',
//   '2025-08-22 23:59',
//   ['土日OK', '第三土曜OK'],
//   2,   // minHours
//   3    // minDays
// );
