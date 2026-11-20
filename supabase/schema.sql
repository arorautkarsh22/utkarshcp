-- =============================================
-- Supabase Schema for Portfolio Management
-- =============================================

-- 1. SECTIONS TABLE
create table if not exists public.sections (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sections enable row level security;

create policy "Public can read sections"
on public.sections for select using (true);

create policy "Authenticated users can insert sections"
on public.sections for insert to authenticated with check (true);

create policy "Authenticated users can update sections"
on public.sections for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete sections"
on public.sections for delete to authenticated using (true);

-- Seed current sections
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


-- 2. COMPANIES / SUBCATEGORIES TABLE
create table if not exists public.companies (
  id text primary key,
  section_id text not null references public.sections(id) on delete cascade,
  name text not null,
  website_url text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Public can read companies"
on public.companies for select using (true);

create policy "Authenticated users can insert companies"
on public.companies for insert to authenticated with check (true);

create policy "Authenticated users can update companies"
on public.companies for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete companies"
on public.companies for delete to authenticated using (true);

-- Seed existing companies
insert into public.companies (id, section_id, name, sort_order)
values
  ('bp-aws', 'brochures-posters', 'AWS', 1),
  ('bp-auraweb', 'brochures-posters', 'AuraWeb', 2),
  ('bp-bavanya', 'brochures-posters', 'Bavanya', 3),
  ('bp-log10', 'brochures-posters', 'Log10', 4),
  ('bp-hindustan', 'brochures-posters', 'Hindustan Water Solution', 5),
  ('bp-peakfreaks', 'brochures-posters', 'The Peak Freaks', 6),
  ('clothing-debug', 'clothing', 'DEBUG', 1),
  ('logos-aws', 'logos', 'AWS', 1),
  ('logos-bavanya', 'logos', 'Bavanya', 2),
  ('logos-log10', 'logos', 'Log10', 3),
  ('logos-rabal', 'logos', 'Rabal', 4),
  ('logos-uiorbit', 'logos', 'UI Orbit', 5),
  ('socials-auraweb', 'socials', 'AuraWeb', 1),
  ('socials-aws', 'socials', 'AWS', 2),
  ('webdev-sge', 'web-development', 'SGE Real Estates', 1)
on conflict (id) do nothing;


-- 3. PORTFOLIO ITEMS (PHOTOS) TABLE
create table if not exists public.portfolio_items (
  id text primary key,
  section_id text not null references public.sections(id) on delete cascade,
  subcategory text not null default 'Misc',
  title text not null,
  full text not null,
  thumb text not null,
  is_instagram boolean not null default false,
  is_brochure boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

create policy "Public can read portfolio items"
on public.portfolio_items for select using (true);

create policy "Authenticated users can insert portfolio items"
on public.portfolio_items for insert to authenticated with check (true);

create policy "Authenticated users can update portfolio items"
on public.portfolio_items for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete portfolio items"
on public.portfolio_items for delete to authenticated using (true);


-- 4. DELETED ITEMS TABLE (Tracks removal of local manifest photos)
create table if not exists public.deleted_items (
  id text primary key,
  deleted_at timestamptz not null default now()
);

alter table public.deleted_items enable row level security;

create policy "Public can read deleted items"
on public.deleted_items for select using (true);

create policy "Authenticated users can insert deleted items"
on public.deleted_items for insert to authenticated with check (true);

create policy "Authenticated users can delete from deleted items"
on public.deleted_items for delete to authenticated using (true);


-- 5. STORAGE BUCKET FOR PHOTO UPLOADS
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

create policy "Public Access to portfolio media"
on storage.objects for select
using ( bucket_id = 'portfolio-media' );

create policy "Admins can upload to portfolio media"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'portfolio-media' );

create policy "Admins can delete from portfolio media"
on storage.objects for delete
to authenticated
using ( bucket_id = 'portfolio-media' );
