drop table if exists tasks cascade;
drop table if exists edges cascade;
drop table if exists nodes cascade;
drop table if exists projects cascade;

-- プロジェクト
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp default now()
);

-- ノード
create table nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,       -- タイトルや名前
  description text,
  created_at timestamp default now()
);

-- エッジ（ノード間の依存関係）
create table edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  source_node_id uuid not null references nodes(id) on delete cascade,
  target_node_id uuid not null references nodes(id) on delete cascade,
  created_at timestamp default now()
);

-- タスク（ノードに必ず紐づく）
create table tasks (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references nodes(id) on delete cascade unique,  -- 1:1対応
  title text not null,
  description text,
  start_date date,
  end_date date,
  created_at timestamp default now()
);
