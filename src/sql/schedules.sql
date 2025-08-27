先ほどの「ユーザーに紐づくタグ」構成と同じく、スケジュール機能も最小構成＋本番/開発切替SQLをまとめられます。

以下は スケジュール最小構成 に タグ付け機能も含めた完全版です。
これを入れれば、ユーザーのスケジュールにタグを付けて管理でき、開発⇔本番の切り替えもできます。

① テーブル定義（共通・必須）


create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text
);
alter table profiles enable row level security;
-- スケジュール本体
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- タグマスタ（全ユーザー共通で使える）
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
-- スケジュールとタグの中間テーブル（多対多）
CREATE TABLE IF NOT EXISTS schedule_tags (
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (schedule_id, tag_id)
);
-- RLS有効化
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_tags ENABLE ROW LEVEL SECURITY;
② ポリシー削除（切替時共通）


-- schedules
DROP POLICY IF EXISTS "dev_select_schedules" ON schedules;
DROP POLICY IF EXISTS "dev_insert_schedules" ON schedules;
DROP POLICY IF EXISTS "dev_update_schedules" ON schedules;
DROP POLICY IF EXISTS "dev_delete_schedules" ON schedules;
DROP POLICY IF EXISTS "prod_select_schedules" ON schedules;
DROP POLICY IF EXISTS "prod_insert_schedules" ON schedules;
DROP POLICY IF EXISTS "prod_update_schedules" ON schedules;
DROP POLICY IF EXISTS "prod_delete_schedules" ON schedules;
-- tags
DROP POLICY IF EXISTS "dev_select_tags" ON tags;
DROP POLICY IF EXISTS "dev_insert_tags" ON tags;
DROP POLICY IF EXISTS "dev_update_tags" ON tags;
DROP POLICY IF EXISTS "dev_delete_tags" ON tags;
DROP POLICY IF EXISTS "prod_select_tags" ON tags;
DROP POLICY IF EXISTS "prod_insert_tags" ON tags;
-- schedule_tags
DROP POLICY IF EXISTS "dev_select_schedule_tags" ON schedule_tags;
DROP POLICY IF EXISTS "dev_insert_schedule_tags" ON schedule_tags;
DROP POLICY IF EXISTS "dev_update_schedule_tags" ON schedule_tags;
DROP POLICY IF EXISTS "dev_delete_schedule_tags" ON schedule_tags;
DROP POLICY IF EXISTS "prod_select_schedule_tags" ON schedule_tags;
DROP POLICY IF EXISTS "prod_insert_schedule_tags" ON schedule_tags;
DROP POLICY IF EXISTS "prod_delete_schedule_tags" ON schedule_tags;
③ 開発用ポリシー（制限なし）


-- schedules
DROP POLICY IF EXISTS dev_select_schedules ON schedules;
DROP POLICY IF EXISTS dev_insert_schedules ON schedules;
DROP POLICY IF EXISTS dev_update_schedules ON schedules;
DROP POLICY IF EXISTS dev_delete_schedules ON schedules;
CREATE POLICY "dev_select_schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "dev_insert_schedules" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_schedules" ON schedules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_schedules" ON schedules FOR DELETE USING (true);
-- schedule_tags
DROP POLICY IF EXISTS dev_select_schedule_tags ON schedule_tags;
DROP POLICY IF EXISTS dev_insert_schedule_tags ON schedule_tags;
DROP POLICY IF EXISTS dev_update_schedule_tags ON schedule_tags;
DROP POLICY IF EXISTS dev_delete_schedule_tags ON schedule_tags;
CREATE POLICY "dev_select_schedule_tags" ON schedule_tags FOR SELECT USING (true);
CREATE POLICY "dev_insert_schedule_tags" ON schedule_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_schedule_tags" ON schedule_tags FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_schedule_tags" ON schedule_tags FOR DELETE USING (true);
-- tags
DROP POLICY IF EXISTS dev_select_tags ON tags;
DROP POLICY IF EXISTS dev_insert_tags ON tags;
DROP POLICY IF EXISTS dev_update_tags ON tags;
DROP POLICY IF EXISTS dev_delete_tags ON tags;
CREATE POLICY "dev_select_tags" ON tags FOR SELECT USING (true);
CREATE POLICY "dev_insert_tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_tags" ON tags FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_tags" ON tags FOR DELETE USING (true);
④ 本番用ポリシー（安全）


-- schedules: 自分のスケジュールのみ閲覧・編集
CREATE POLICY "prod_select_schedules" ON schedules
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prod_insert_schedules" ON schedules
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prod_update_schedules" ON schedules
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prod_delete_schedules" ON schedules
FOR DELETE USING (auth.uid() = user_id);
-- tags: 全員閲覧可、作成は認証ユーザーのみ
CREATE POLICY "prod_select_tags" ON tags
FOR SELECT USING (true);
CREATE POLICY "prod_insert_tags" ON tags
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- schedule_tags: 自分のスケジュールに紐づくタグだけ操作可
CREATE POLICY "prod_select_schedule_tags" ON schedule_tags
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.id = schedule_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "prod_insert_schedule_tags" ON schedule_tags
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.id = schedule_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "prod_delete_schedule_tags" ON schedule_tags
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.id = schedule_id AND s.user_id = auth.uid()
  )
);
運用ルール
初回

①を投入（テーブル作成）

②を投入（ポリシー初期化）

③または④を投入（開発か本番か選択）

開発⇔本番切替

②を投入（ポリシー削除）

③（開発）または④（本番）を投入

この形にすると、スケジュールもタグも同じ構造で管理できるので、
クエリ側も共通化しやすくなります。

このスケジュール＋タグ版も、Supabase CLI の migration にまとめて一括管理できますが、
まとめますか？
そうすると、コマンド一発で開発・本番の切替ができます。

 

 

了解です。では、複数タグ指定 + 複数時間帯検索 + 通知対象抽出 を一発でできる SQL テンプレートを作ります。
Supabase Edge Function にそのまま組み込みやすい形にします。