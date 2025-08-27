-- タグマスタ
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ユーザーとタグの中間テーブル（多対多）
CREATE TABLE IF NOT EXISTS user_tags (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

-- RLS有効化
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;


② ポリシー切替のための前処理（全削除）
開発→本番、本番→開発の切替時に実行
（既存ポリシーを全部消す）



-- tags
DROP POLICY IF EXISTS "dev_select_tags" ON tags;
DROP POLICY IF EXISTS "dev_insert_tags" ON tags;
DROP POLICY IF EXISTS "dev_update_tags" ON tags;
DROP POLICY IF EXISTS "dev_delete_tags" ON tags;
DROP POLICY IF EXISTS "prod_select_tags" ON tags;
DROP POLICY IF EXISTS "prod_insert_tags" ON tags;
-- user_tags
DROP POLICY IF EXISTS "dev_select_user_tags" ON user_tags;
DROP POLICY IF EXISTS "dev_insert_user_tags" ON user_tags;
DROP POLICY IF EXISTS "dev_update_user_tags" ON user_tags;
DROP POLICY IF EXISTS "dev_delete_user_tags" ON user_tags;
DROP POLICY IF EXISTS "prod_select_user_tags" ON user_tags;
DROP POLICY IF EXISTS "prod_insert_user_tags" ON user_tags;
DROP POLICY IF EXISTS "prod_delete_user_tags" ON user_tags;


③ 開発用ポリシー（制限なし・デバッグ向け）
切替時に投入（本番時は不要）



-- tags
DROP POLICY IF EXISTS dev_select_tags ON tags;
DROP POLICY IF EXISTS dev_insert_tags ON tags;
DROP POLICY IF EXISTS dev_update_tags ON tags;
DROP POLICY IF EXISTS dev_delete_tags ON tags;
CREATE POLICY "dev_select_tags" ON tags FOR SELECT USING (true);
CREATE POLICY "dev_insert_tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_tags" ON tags FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_tags" ON tags FOR DELETE USING (true);
-- user_tags
DROP POLICY IF EXISTS dev_select_user_tags ON user_tags;
DROP POLICY IF EXISTS dev_insert_user_tags ON user_tags;
DROP POLICY IF EXISTS dev_update_user_tags ON user_tags;
DROP POLICY IF EXISTS dev_delete_user_tags ON user_tags;
CREATE POLICY "dev_select_user_tags" ON user_tags FOR SELECT USING (true);
CREATE POLICY "dev_insert_user_tags" ON user_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_user_tags" ON user_tags FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_user_tags" ON user_tags FOR DELETE USING (true);


④ 本番用ポリシー（セキュア）
切替時に投入（開発時は不要）



-- tags: 全員閲覧可、作成は認証ユーザーのみ
CREATE POLICY "prod_select_tags" ON tags
FOR SELECT USING (true);
CREATE POLICY "prod_insert_tags" ON tags
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- user_tags: 自分の user_id のみ操作可
CREATE POLICY "prod_select_user_tags" ON user_tags
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prod_insert_user_tags" ON user_tags
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prod_delete_user_tags" ON user_tags
FOR DELETE USING (auth.uid() = user_id);


運用手順（開発⇔本番切替）
まず②の削除SQLを実行（既存ポリシーのクリーンアップ）

開発時 → ③のSQLを実行
本番時 → ④のSQLを実行

こうすれば投入するファイルは 3種類だけ に固定できます。

tables.sql → ①（最初だけ）

clear_policies.sql → ②（切替前に必ず）

dev_policies.sql または prod_policies.sql → ③ or ④

もし希望があれば、
この3種類を Supabase CLIの migration にして
supabase db push 一発切替にできます。

