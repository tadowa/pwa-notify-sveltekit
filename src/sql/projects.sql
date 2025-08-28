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
-- 既存テーブル削除（必要に応じて）
DROP TABLE IF EXISTS tasks CASCADE;
-- tasks テーブル作成
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE, -- 1:1対応
  title text NOT NULL,
  description text,
  start_date timestamptz,  -- タイムゾーン付き
  end_date timestamptz,    -- タイムゾーン付き
  created_at timestamptz DEFAULT now()
);







[{"idx":0,"id":"50cf4a60-7bf9-4da8-9b52-b59f243b4069","name":"Project 1","description":"Description for Project 1","created_at":"2025-08-27 11:02:08.788318"}]




-- 既存テーブル削除（必要に応じて）
DROP TABLE IF EXISTS projects CASCADE;
-- プロジェクト
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  base_estimated_hours numeric default 1, -- 正規化基準
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

INSERT INTO projects (id, title, description, base_estimated_hours) VALUES
('50cf4a60-7bf9-4da8-9b52-b59f243b4069', 'project 1', 'Description for Project 1', 30 );

DROP TABLE IF EXISTS tasks CASCADE;
-- タスク
create table tasks (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references nodes(id) on delete cascade unique,
  title text default '',
  description text,
  estimated_hours numeric not null default 1, -- 質量
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

INSERT INTO tasks (node_id, title, description, estimated_hours) VALUES
('f2a7d9c8-2e9c-4a7d-8f2c-3e9b7f2a5d4c', 'Task 1', 'Description for Task 1', 0.05),
('d9e2c8b7-4f3a-4c7e-8a2f-7b3d9f2a6c1e', 'Task 2', 'Description for Task 2', 0.05),
('47e2c5a1-9d8f-4b3e-8c2a-7d1f2a9c8b4e', 'Task 3', 'Description for Task 3', 0.05),
('a8b2c7d1-3f9e-4c2a-8b7f-1d2c9f3e7a5b', 'Task 4', 'Description for Task 4', 0.05),
('2d3f7a8c-9b1e-4c7a-8f2d-5a9c7e2f3b1d', 'Task 5', 'Description for Task 5', 0.05),
('e1f9a2c3-5d7e-4c1a-9f8b-2a7d5c3f1e9a', 'Task 6', 'Description for Task 6', 0.05),
('4b7d2e9f-1c3a-4a7f-9e2b-6c5a7d3f9e1c', 'Task 7', 'Description for Task 7', 0.05),
('c2f7a1b9-8e3d-4c5a-9f7b-2a3c9e1d7f5b', 'Task 8', 'Description for Task 8', 0.05),
('3e9b7f2a-1d4c-4c7a-9b2f-7e1a5c3d8f9b', 'Task 9', 'Description for Task 9', 0.05);

