-- UUID 확장 기능 활성화
create extension if not exists "uuid-ossp";

-- 1. 설정 테이블 (비밀번호, 메인 배경)
create table settings (
  id int primary key generated always as identity,
  password text default '1234',
  global_backgrounds text[] default '{}'
);

-- 초기 설정값 추가
insert into settings (password, global_backgrounds) values ('1234', ARRAY[]::text[]);

-- 2. 캠페인 테이블
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sub_title text,
  system text not null,
  logo_url text,
  background_images text[] default '{}',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. 캐릭터 테이블
create table characters (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  name text not null,
  is_npc boolean default false,
  image_url text,
  image_fit text default 'cover',
  summary text,
  description text,
  dnd_class text,
  dnd_subclass text,
  cpred_role text,
  cpred_origin text,
  custom_class text,
  custom_subclass text,
  updated_at bigint default extract(epoch from now()) * 1000
);

-- 4. 추가 파일(비밀/이미지 등) 테이블
create table extra_files (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  title text not null,
  content text,
  image_url text,
  use_as_portrait boolean default false,
  is_secret boolean default false
);

-- RLS (Row Level Security) 설정 - 누구나 읽고 쓸 수 있도록 개방
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;

create policy "Public Access Settings" on settings for all using (true) with check (true);
create policy "Public Access Campaigns" on campaigns for all using (true) with check (true);
create policy "Public Access Characters" on characters for all using (true) with check (true);
create policy "Public Access ExtraFiles" on extra_files for all using (true) with check (true);