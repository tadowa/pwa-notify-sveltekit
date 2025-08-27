なるほど、あなたがSupabaseに投入したのは PostgreSQLのストアド関数（SQL関数） ですね。Edge Functionではなく、DB内に作成された関数です。
確認方法を整理します。

1. Supabase Studio（Webコンソール）で確認

プロジェクトにログイン

左メニューから 「SQL Editor」 → 「Query」 に移動

関数を確認するSQLを実行：

-- 関数一覧を取得
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE specific_schema = 'public';


get_available_users_by_time_and_tags がリストにあれば存在している

デプロイ日や作成日を見たい場合は PostgreSQL の pg_proc と pg_namespace を使う方法もあります：

SELECT p.proname AS function_name,
       n.nspname AS schema_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'get_available_users_by_time_and_tags';
