-- 公众号互友社：Supabase 数据库初始化脚本
-- 在 Supabase Dashboard -> SQL Editor 中完整执行。

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  category text not null default '其他',
  author text,
  description text check (description is null or char_length(description) <= 180),
  qr_image_url text not null,
  article_url text,
  article_title text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists accounts_created_at_idx on public.accounts (created_at desc);
create index if not exists accounts_category_idx on public.accounts (category);

alter table public.accounts enable row level security;

-- 公开读取：所有访客都可以浏览公众号信息。
drop policy if exists "Public can read accounts" on public.accounts;
create policy "Public can read accounts"
on public.accounts for select
to anon, authenticated
using (true);

-- 公开投稿：任何访客可新增记录。字段长度由表约束限制。
drop policy if exists "Anyone can submit accounts" on public.accounts;
create policy "Anyone can submit accounts"
on public.accounts for insert
to anon, authenticated
with check (
  char_length(name) between 1 and 40
  and char_length(category) between 1 and 20
  and char_length(coalesce(description, '')) <= 180
  and qr_image_url like 'https://%'
  and (
    article_url is null
    or (
      article_url like 'https://mp.weixin.qq.com/%'
      or article_url like 'https://weixin.qq.com/%'
    )
  )
);

-- 公开图片桶：允许访客上传二维码图片并公开读取。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-assets', 'public-assets', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can upload QR images" on storage.objects;
create policy "Public can upload QR images"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'public-assets'
  and (storage.foldername(name))[1] = 'qr'
  and lower(storage.extension(name)) in ('png','jpg','jpeg','webp')
);

drop policy if exists "Public can read QR images" on storage.objects;
create policy "Public can read QR images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'public-assets');

-- 注意：本版本按需求设置为“上传即公开”，没有开放匿名修改或删除权限。
-- 如需删除违规内容，请在 Supabase Dashboard 的 Table Editor / Storage 中由管理员处理。
