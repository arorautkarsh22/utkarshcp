-- 1. Create sections table
create table if not exists public.sections (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.sections enable row level security;

-- 3. Policy: Public can read all sections
create policy "Public can read sections"
on public.sections
for select
using (true);

-- 4. Policy: Authenticated users (Admin) can insert sections
create policy "Authenticated users can insert sections"
on public.sections
for insert
to authenticated
with check (true);

-- 5. Policy: Authenticated users (Admin) can update sections
create policy "Authenticated users can update sections"
on public.sections
for update
to authenticated
using (true)
with check (true);

-- 6. Policy: Authenticated users (Admin) can delete sections
create policy "Authenticated users can delete sections"
on public.sections
for delete
to authenticated
using (true);

-- 7. Seed current sections
insert into public.sections (id, title, subtitle, sort_order, visible)
values
  ('clothing', 'Clothing', 'Apparel design mockups and merchandise concepts', 1, true),
  ('logos', 'Logos', 'Brand marks, symbols, and identity systems', 2, true),
  ('brochures-posters', 'Brochures & Posters', 'Print design, event posters, and marketing collateral', 3, true),
  ('socials', 'Socials', 'Social media graphics and digital campaigns', 4, true),
  ('web-development', 'Web Development (UI/UX)', 'User interfaces and digital experiences', 5, true)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order;
