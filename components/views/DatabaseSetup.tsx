
import React, { useState } from 'react';
import { Icons } from '../ui/Icons';

export const SCHEMA_SQL = `
-- UUID 확장 기능 활성화
create extension if not exists "uuid-ossp";

-- 1. 설정 테이블 (비밀번호, 메인 배경)
create table if not exists settings (
  id int primary key generated always as identity,
  password text default '1234',
  global_backgrounds text[] default '{}'
);

insert into settings (password, global_backgrounds) 
select '1234', ARRAY[]::text[]
where not exists (select 1 from settings);

-- 2. 캠페인 테이블
create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sub_title text,
  system text not null,
  logo_url text,
  background_images text[] default '{}',
  description text,
  theme text default 'ADVENTURE',
  alias_label text, 
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. 캐릭터 테이블
create table if not exists characters (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  name text not null,
  alias text, 
  is_name_blurred boolean default false, 
  
  real_name text,
  player_name text,
  is_npc boolean default false,
  image_url text,
  image_fit text default 'cover',
  summary text,
  description text,
  level_or_exp text,
  affiliations jsonb, 
  
  -- Bio Fields --
  age text,
  gender text,
  height text,
  weight text,
  appearance text,
  
  dnd_class text,
  dnd_subclass text,
  cpred_role text,
  cpred_origin text,
  custom_class text,
  custom_subclass text,
  
  secret_profile jsonb, 

  updated_at bigint default extract(epoch from now()) * 1000
);

-- 4. 추가 파일(비밀/이미지 등) 테이블
create table if not exists extra_files (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  title text not null,
  content text,
  image_url text,
  use_as_portrait boolean default false,
  is_secret boolean default false,
  file_type text default 'REGULAR',
  combat_stats jsonb,
  image_fit text default 'cover'
);

-- 5. 캐릭터 코멘트(댓글) 테이블
create table if not exists character_comments (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  user_name text not null,
  content text not null,
  style_variant text default 'NOTE',
  font text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (Row Level Security) 설정
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;
alter table character_comments enable row level security;

-- 정책 생성
drop policy if exists "Public Access Settings" on settings;
create policy "Public Access Settings" on settings for all using (true) with check (true);

drop policy if exists "Public Access Campaigns" on campaigns;
create policy "Public Access Campaigns" on campaigns for all using (true) with check (true);

drop policy if exists "Public Access Characters" on characters;
create policy "Public Access Characters" on characters for all using (true) with check (true);

drop policy if exists "Public Access ExtraFiles" on extra_files;
create policy "Public Access ExtraFiles" on extra_files for all using (true) with check (true);

drop policy if exists "Public Access Comments" on character_comments;
create policy "Public Access Comments" on character_comments for all using (true) with check (true);

-- 스키마 캐시 리로드
NOTIFY pgrst, 'reload config';
`;

const UPDATE_SQL = `
-- 기존 업데이트
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='secret_profile') then
    alter table characters add column secret_profile jsonb;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='player_name') then
    alter table characters add column player_name text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='level_or_exp') then
    alter table characters add column level_or_exp text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name='character_comments' and column_name='font') then
    alter table character_comments add column font text;
  end if;
end $$;

-- 신규 업데이트 (Alias/Blur/Affiliations/ExtraFiles Expanded)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='alias_label') then
    alter table campaigns add column alias_label text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='alias') then
    alter table characters add column alias text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='is_name_blurred') then
    alter table characters add column is_name_blurred boolean default false;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='affiliations') then
    alter table characters add column affiliations jsonb;
  end if;

  -- Extra Files expansion
  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='file_type') then
    alter table extra_files add column file_type text default 'REGULAR';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='combat_stats') then
    alter table extra_files add column combat_stats jsonb;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='image_fit') then
    alter table extra_files add column image_fit text default 'cover';
  end if;
end $$;

-- RLS 정책 재설정
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;
alter table character_comments enable row level security;

drop policy if exists "Public Access Settings" on settings;
create policy "Public Access Settings" on settings for all using (true) with check (true);

drop policy if exists "Public Access Campaigns" on campaigns;
create policy "Public Access Campaigns" on campaigns for all using (true) with check (true);

drop policy if exists "Public Access Characters" on characters;
create policy "Public Access Characters" on characters for all using (true) with check (true);

drop policy if exists "Public Access ExtraFiles" on extra_files;
create policy "Public Access ExtraFiles" on extra_files for all using (true) with check (true);

drop policy if exists "Public Access Comments" on character_comments;
create policy "Public Access Comments" on character_comments for all using (true) with check (true);

NOTIFY pgrst, 'reload config';
`;

const RESTORE_DATA_SQL = `
-- 1. 캠페인 데이터 복원
INSERT INTO campaigns (id, name, sub_title, system, theme, alias_label) VALUES
('0c35fa0a-5fc9-4089-9636-a023af13e023', '오피스 프로파일', 'NightCity,2045', 'CPRED', 'CYBERPUNK', '핸들'),
('9f73f248-0d0c-4433-bae6-b8100189f5cd', '군단 명부', '', 'BAND_OF_BLADES', 'MILITARY', NULL),
('efbfb517-52aa-4037-ba65-0bb21d1b5e00', '트롤스컬 연명부', 'Forgotten Realms', 'DND5E', 'ADVENTURE', '이명'),
('ea0c3eb2-8bad-46f1-9318-7c039175a19a', '괴담집', 'Ravenloft', 'DND5E', 'GOTHIC', NULL)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, sub_title = EXCLUDED.sub_title, system = EXCLUDED.system, theme = EXCLUDED.theme, alias_label = EXCLUDED.alias_label;

-- 2. 캐릭터 데이터 복원 (주요 캐릭터 예시)
INSERT INTO characters (id, campaign_id, name, player_name, is_npc, summary, description, dnd_class, cpred_role, custom_class, level_or_exp, age, gender, height, weight, appearance, alias, is_name_blurred, affiliations, secret_profile, updated_at) VALUES
-- Sadie Jackson (Office)
('020bfd21-ada1-43e5-8dda-53e4973b4763', '0c35fa0a-5fc9-4089-9636-a023af13e023', 'Sadie Jackson', '델리', false, '핸들: 스페이드', '컴뱃존에서 생활하던 가족들이 어릴 적 기업의 횡포에 휘말려 사살당하고 고아로 남게된다...', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'SPADE', true, NULL, NULL, 1771203776250),
-- Philo (Trollskull)
('0e4fc7b8-50ec-42c1-a3c2-27aba8cbc5ed', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '필로', '델리', false, '', NULL, 'Wizard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', false, '[{"id": "fa18a19c-ddf5-4cde-afda-bc94aa014ed3", "name": "마법사", "isHidden": false, "isStrikethrough": false}]', NULL, 1771207578408),
-- Gwyn Kim (Office)
('1a347def-b043-4401-800a-4fd40da7aef1', '0c35fa0a-5fc9-4089-9636-a023af13e023', '그윈 킴', '승훈', false, '부재 시 연락은 간결하게, 가급적이면 문자로 부탁합니다.', '부산 사태를 피해 도망친 아라사카 소속 부모가...', NULL, '로커보이', NULL, '5', '27', '남성', '175cm', '60kg', '[대상 분석 보고서: !ntern (Gwyn Kim)]...', '!nte5rn', true, '[{"id": "5cab8a7d-08e7-4651-b81e-79afe7d4fb1a", "name": "밀리테크", "rank": "전략기획실", "isHidden": false, "isStrikethrough": false}, {"id": "dd68d768-69ef-4737-ba7f-1668f593cccd", "name": "오피스", "rank": "픽서", "isHidden": false, "isStrikethrough": false}]', '{"alias": "", "levelOrExp": ""}', 1771419797901),
-- Jusex (Trollskull NPC)
('26a6d88b-95a6-4b36-b6a9-ff09eecfe309', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '주섁스', '피쉬', true, '', '', 'Barbarian', NULL, NULL, 'CR 3', NULL, NULL, NULL, NULL, NULL, '', false, NULL, '{"name": "자렉슬 배너", "alias": ""}', 1771411265497),
-- Semya (Legion)
('373bfa9e-55cb-411a-a544-fb5510a36aca', '9f73f248-0d0c-4433-bae6-b8100189f5cd', '세먀', '승훈', false, '', '', NULL, NULL, '지휘관', '', NULL, NULL, NULL, NULL, NULL, '', false, '[{"id": "99e0c98f-8627-4bbb-b324-672466f70635", "name": "군단", "isHidden": false, "isStrikethrough": false}]', NULL, 1771419709760),
-- Shaolang (Trollskull NPC)
('3a789040-7eb2-45ef-b309-ef4ccfcdb139', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '샤오랑', '피쉬', true, '', '', 'Barbarian', NULL, NULL, 'CR ???', NULL, NULL, NULL, NULL, NULL, '', false, NULL, '{"alias": "", "levelOrExp": "CR 10"}', 1771413672895),
-- Manshoon (Trollskull NPC)
('8422708e-8443-4832-ab08-6ab22f07456f', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '맨슌', '피쉬', true, '', '', 'Barbarian', NULL, NULL, 'CR 13', NULL, NULL, NULL, NULL, NULL, '', false, NULL, NULL, 1771414127946),
-- Red Endurance (Legion)
('5ef0319c-8dc8-4077-a77e-c8c1c56de849', '9f73f248-0d0c-4433-bae6-b8100189f5cd', '붉은 버텨냄', '피쉬', false, '', '', NULL, NULL, '지휘관', NULL, NULL, NULL, NULL, NULL, NULL, '', false, '[{"id": "5c2cf6fe-fd8c-4b4a-bc6b-f17ec6e351d6", "name": "군단", "isHidden": false, "isStrikethrough": false}]', NULL, 1771419807321),
-- Patrick Lake (Office)
('61cfaf1c-cfc9-42bb-9b40-478b7ba9014b', '0c35fa0a-5fc9-4089-9636-a023af13e023', '패트릭 레이크', '승훈', false, '남자.인생은.50세부터.지금부턴,젊게^^', '[신원 식별 정보] 등록명: 야마토123...', NULL, NULL, NULL, '4', '58세', '남성', '202cm', '120kg', '[대상 분석 보고서: YOUNGTAMATO123]...', 'YOUNGYAMATO123', true, '[{"id": "fe33ccc5-34c2-45d2-a91d-ec50ffaae47a", "name": "오피스", "rank": "솔로", "isHidden": false, "isStrikethrough": false}]', '{"age": "58세", "name": "패트릭 레이크", "alias": "FeiHu", "gender": "남성", "height": "260cm(과거)", "weight": "180kg(과거)", "summary": "이빨 빠진 호랑이", "realName": "패트릭 레이크"}', 1771419789612),
-- Arask (Trollskull)
('6592ba98-a3d1-47d5-9e27-1ccf7aaea70d', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '아라스크', '승훈', false, '판델버의 낙뢰', '지부장이 사막을 가로지르며 날아가는 푸른빛의 고룡을 꿈에서 본 날...', 'Sorcerer', NULL, NULL, 'LV.13', '32', '남성', '198cm', '130kg', '상대적으로 늘씬한 체형의 블루 드래곤본...', '', false, '[{"id": "8985bb59-5687-46d0-becb-be00e0dd06ff", "name": "발더스게이트", "rank": "하원의원", "isHidden": false, "isStrikethrough": false}]', '{"alias": "", "extraFiles": [], "affiliations": [{"id": "a1aaa4c4-50f7-4a1f-8596-7a5e4d8ee476", "name": "발더스게이트", "rank": "하원의원", "isHidden": false, "isStrikethrough": false}]}', 1771404967810),
-- Zariel (Trollskull NPC)
('65e4cc6b-4705-4caa-adb0-967c26a15599', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '자리엘', '피쉬', true, '아베르누스의 주인', NULL, 'Barbarian', NULL, NULL, 'CR 26', '????', '여', NULL, NULL, NULL, '', false, '[{"id": "68c7fd3c-d76e-4db6-81b0-ac1767e7929e", "name": "천사", "rank": "솔라", "isHidden": false, "isStrikethrough": true}]', '{"name": "자리엘", "alias": ""}', 1771419149912),
-- Victorio (Trollskull NPC)
('74a0d870-af1c-4e5e-98fe-4242d6125a67', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '빅토리오 캐설런터', '피쉬', true, '', '', 'Barbarian', NULL, NULL, 'CR ???', NULL, NULL, NULL, NULL, NULL, '', false, NULL, '{"alias": "", "levelOrExp": "CR 5"}', 1771413689211),
-- Scalgral (Trollskull)
('8e3378d8-01b7-4afb-bb03-f33bcf5adca7', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '스칼그랄 아이언헬름', '승훈', false, '판델버 주식회사 모험 2팀 팀장', '스칼그랄은 템푸스의 가르침을 잘 따르는 자였다...', 'Cleric', NULL, NULL, 'LV.10', '160', '남성', '147cm', '75kg', '중년의 드워프로, 어깨와 팔에 쌓인 근육은...', '', false, '[{"id": "4bb4a666-87b4-409e-a408-2e2f07d0a4c7", "name": "드워프", "isHidden": false, "isStrikethrough": false}]', NULL, 1771399238941),
-- Amalia (Trollskull NPC)
('9479aed7-dffd-4aa8-a6e6-f24fa9c091fc', 'efbfb517-52aa-4037-ba65-0bb21d1b5e00', '아말리아 캐설런터', '피쉬', true, '', '', 'Barbarian', NULL, NULL, 'CR ???', NULL, NULL, NULL, NULL, NULL, '', false, NULL, '{"alias": "", "levelOrExp": "CR 5"}', 1771413689211),
-- Aurora (Legion)
('acfa2131-6557-4998-828a-7a035331a13f', '9f73f248-0d0c-4433-bae6-b8100189f5cd', '오로라 공작', '피쉬', false, '', '', NULL, NULL, '지휘관', NULL, NULL, NULL, NULL, NULL, NULL, '', false, '[{"id": "bc0e22ae-c347-427f-b9fe-7b3bc814aed3", "name": "군단", "isHidden": false, "isStrikethrough": false}]', NULL, 1771419904277),
-- Nocturne (Ravenloft)
('bdf973d2-a075-4313-b7d1-cb170d04eb92', 'ea0c3eb2-8bad-46f1-9318-7c039175a19a', '녹턴 (Nocturne)', '배추', false, '\"어둠의 다크\"', NULL, 'Rogue', NULL, NULL, 'LV. 10', '20', '남성', '177cm', '75kg', '전형적인 아시마르의 외형이지만...', '', false, '[{"id": "8775107d-ef5f-4506-853a-97ff01ce3c14", "name": "판델버 주식회사", "rank": "모험 2팀", "isHidden": false, "isStrikethrough": false}]', '{"age": "", "name": "Raven", "alias": "", "gender": "짐승", "height": "230 cm", "weight": "95 kg"}', 1771256421698),
-- Raven (Ravenloft)
('cf82999e-7360-449e-b9b9-d2932970af4b', 'ea0c3eb2-8bad-46f1-9318-7c039175a19a', '레이븐 (Raven)', '배추', false, '', NULL, 'Ranger', NULL, NULL, 'Lv. 10', '32세', '남성', '180 cm', '77 kg', NULL, '레이븐 (Raven)', true, '[{"id": "a6e66d33-6b3b-44f5-9025-648209615863", "name": "안개 속 모험가", "isHidden": false, "isStrikethrough": false}]', '{"age": "", "name": "Raven", "alias": "", "gender": "짐승", "height": "230 cm", "weight": "95 kg"}', 1771256421698),
-- Estella (Ravenloft)
('e1fb36b3-467c-4196-8caf-040f19663ac6', 'ea0c3eb2-8bad-46f1-9318-7c039175a19a', '에스텔라 루미에르', '승훈', false, '사랑과 정의의 이름으로!', '보라, 이 이야기는 안개 속을 헤매는...', 'Warlock', NULL, NULL, 'LV.10', '??세', '여성', '165cm', '비밀이에요~★', '1. 의복의 청결성에 대해 언급하지 마십시오...', 'THE STAR', false, '[{"id": "8bb3cd20-3ea9-4e61-adc2-25d488667cf3", "name": "마법사", "isHidden": false, "isStrikethrough": false}]', '{"age": "17세", "name": "김민지", "alias": "THE STAR", "gender": "여성", "height": "163cm", "weight": "53kg", "summary": "\\\"내...내가 대체 뭘 그리 잘못했다고 그래요...\\\"", "comments": [], "realName": ""}', 1771419350624)
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id, name = EXCLUDED.name, player_name = EXCLUDED.player_name, summary = EXCLUDED.summary, secret_profile = EXCLUDED.secret_profile;

-- 3. 추가 파일(아이템 등)
INSERT INTO extra_files (id, character_id, title, content, file_type) VALUES
('7277c589-7d7f-4206-ae58-10422a84fe40', '6592ba98-a3d1-47d5-9e27-1ccf7aaea70d', '프로필 요약', '컬트 오브 드래곤에서 생체 병기로 길러진...', 'REGULAR')
ON CONFLICT (id) DO NOTHING;

-- 4. 코멘트
INSERT INTO character_comments (id, character_id, user_name, content, style_variant, font, created_at) VALUES
('6dc8764a-af55-468b-b934-f4268ca131fe', '0e4fc7b8-50ec-42c1-a3c2-27aba8cbc5ed', '강승훈', '필로가 담배를 필로가요(깔깔)', 'NOTE', 'HAND', '2026-02-15 00:00:00+00'),
('71b7ea75-ee7b-41b4-8627-79a51c889152', '6592ba98-a3d1-47d5-9e27-1ccf7aaea70d', '베놈', '드래곤본은 진짜 머리카락이 정말 없는거?', 'NOTE', 'HAND', '2026-02-16 00:00:00+00')
ON CONFLICT (id) DO NOTHING;
`;

const STORAGE_SQL = `
-- Supabase Storage 버킷 생성 및 정책 설정
-- 이 SQL은 이미지를 저장할 'images' 버킷을 만들고, 누구나 보고 업로드할 수 있게 설정합니다.

-- 1. 'images' 버킷 생성 (이미 존재하면 무시)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. 기존 정책 정리 (중복 방지)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Update" on storage.objects;

-- 3. 정책 생성
-- 3-1. 누구나 조회 가능 (SELECT)
create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );

-- 3-2. 누구나 업로드 가능 (INSERT)
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'images' );

-- 3-3. 누구나 수정 가능 (UPDATE)
create policy "Public Update" on storage.objects for update using ( bucket_id = 'images' );

-- 설정 완료 확인 메시지
NOTIFY pgrst, 'reload config';
`;

interface Props {
  onRetry: () => void;
  errorMsg?: string;
}

const DatabaseSetup: React.FC<Props> = ({ onRetry, errorMsg }) => {
  const [activeTab, setActiveTab] = useState<'INITIAL' | 'UPDATE' | 'RESTORE' | 'STORAGE'>('STORAGE');

  const copySql = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('SQL이 클립보드에 복사되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center gap-3 mb-6 text-red-400">
          <Icons.Refresh size={32} />
          <h1 className="text-2xl font-bold text-white">데이터베이스 연결 및 설정</h1>
        </div>
        
        {errorMsg && (
          <div className="bg-red-900/50 border border-red-800 p-4 rounded mb-6 text-sm font-mono text-red-200 break-all whitespace-pre-wrap">
            <h3 className="font-bold mb-1">⚠️ 오류 발생</h3>
            {errorMsg}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-1 overflow-x-auto">
           <button 
             onClick={() => setActiveTab('INITIAL')}
             className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'INITIAL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             1. 초기화 (New)
           </button>
           <button 
             onClick={() => setActiveTab('UPDATE')}
             className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'UPDATE' ? 'bg-amber-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             2. 업데이트 (Fix)
           </button>
           <button 
             onClick={() => setActiveTab('RESTORE')}
             className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'RESTORE' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             3. 데이터 복원 (Restore)
           </button>
           <button 
             onClick={() => setActiveTab('STORAGE')}
             className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'STORAGE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             4. 스토리지 설정 (Storage)
           </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'INITIAL' && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 animate-in fade-in">
              <h3 className="text-white font-bold mb-2 flex justify-between items-center">
                <span>데이터베이스 초기화 (모든 데이터 삭제됨)</span>
                <button onClick={() => copySql(SCHEMA_SQL)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors">
                  복사하기
                </button>
              </h3>
              <p className="text-xs text-slate-400 mb-2">테이블을 새로 생성하고 초기 설정을 적용합니다.</p>
              <pre className="text-xs text-slate-400 overflow-auto max-h-64 custom-scrollbar p-2 bg-black/30 rounded">
                {SCHEMA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'UPDATE' && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 ring-2 ring-amber-500/50 animate-in fade-in">
               <h3 className="text-amber-400 font-bold mb-2 flex justify-between items-center">
                <span>스키마 업데이트 (데이터 유지)</span>
                <button onClick={() => copySql(UPDATE_SQL)} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded transition-colors">
                  복사하기
                </button>
              </h3>
              <p className="text-xs text-slate-400 mb-2 font-bold text-amber-200">
                기존 데이터를 유지하면서 누락된 컬럼(비밀 프로필, 파일 타입 등)을 추가합니다.
              </p>
              <pre className="text-xs text-slate-400 overflow-auto max-h-64 custom-scrollbar p-2 bg-black/30 rounded">
                {UPDATE_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'RESTORE' && (
            <div className="bg-slate-900 p-4 rounded-lg border border-emerald-900 ring-2 ring-emerald-500/50 animate-in fade-in">
               <h3 className="text-emerald-400 font-bold mb-2 flex justify-between items-center">
                <span>기존 데이터 복원 (Campaigns & Characters)</span>
                <button onClick={() => copySql(RESTORE_DATA_SQL)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors">
                  복사하기
                </button>
              </h3>
              <p className="text-xs text-slate-400 mb-2 font-bold text-emerald-200">
                백업된 JSON 데이터를 기반으로 캠페인과 캐릭터 정보를 DB에 다시 입력합니다.
              </p>
              <pre className="text-xs text-slate-400 overflow-auto max-h-64 custom-scrollbar p-2 bg-black/30 rounded">
                {RESTORE_DATA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'STORAGE' && (
            <div className="bg-slate-900 p-4 rounded-lg border border-blue-900 ring-2 ring-blue-500/50 animate-in fade-in">
               <h3 className="text-blue-400 font-bold mb-2 flex justify-between items-center">
                <span>Supabase Storage 버킷 생성</span>
                <button onClick={() => copySql(STORAGE_SQL)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors">
                  복사하기
                </button>
              </h3>
              <p className="text-xs text-slate-400 mb-2 font-bold text-blue-200">
                이미지 저장을 위한 'images' 버킷을 생성하고 공개 접근 권한을 설정합니다.<br/>
                (실행 후 Supabase 대시보드의 Storage 메뉴에서 버킷이 생성되었는지 확인하세요)
              </p>
              <pre className="text-xs text-slate-400 overflow-auto max-h-64 custom-scrollbar p-2 bg-black/30 rounded">
                {STORAGE_SQL}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-4 mt-6">
          <div className="text-sm text-slate-400 bg-slate-700/30 p-4 rounded border border-slate-700">
            <strong>진행 방법:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>상단 탭에서 작업을 선택하고 SQL을 <span className="text-blue-400">복사</span>하세요.</li>
              <li>Supabase 대시보드(SQL Editor)에서 쿼리를 실행하세요.</li>
              <li>완료되면 아래 버튼을 눌러주세요.</li>
            </ol>
          </div>
          
          <button 
            onClick={onRetry}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            설정 완료 / 다시 시도
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
