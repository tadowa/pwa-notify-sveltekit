CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone default now()
);

alter table notifications enable row level security;

create policy "Allow all select" on notifications
for select using (true);

create policy "Allow all insert" on notifications
for insert with check (true);

ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;
