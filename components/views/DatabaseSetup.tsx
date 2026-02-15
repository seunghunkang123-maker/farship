import React from 'react';
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
  theme text default 'ADVENTURE', -- New Theme Column
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. 캐릭터 테이블
create table if not exists characters (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  name text not null,
  real_name text,
  is_npc boolean default false,
  image_url text,
  image_fit text default 'cover',
  summary text,
  description text,
  level_or_exp text,
  
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
  is_secret boolean default false
);

-- 5. 캐릭터 코멘트(댓글) 테이블 - 야전교범 스타일
create table if not exists character_comments (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  user_name text not null,
  content text not null,
  style_variant text default 'NOTE',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (Row Level Security) 설정
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;
alter table character_comments enable row level security;

-- 정책 생성 (기존 충돌 방지 위해 drop 후 생성)
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
`;

const UPDATE_SQL = `
-- 1. 야전교범 스타일 코멘트 테이블 추가
create table if not exists character_comments (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  user_name text not null,
  content text not null,
  style_variant text default 'NOTE',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table character_comments enable row level security;
drop policy if exists "Public Access Comments" on character_comments;
create policy "Public Access Comments" on character_comments for all using (true) with check (true);

-- 2. 기존 캠페인 테마 기본값 설정 (NULL -> ADVENTURE)
UPDATE campaigns SET theme = 'ADVENTURE' WHERE theme IS NULL;
`;

interface Props {
  onRetry: () => void;
  errorMsg?: string;
}

const DatabaseSetup: React.FC<Props> = ({ onRetry, errorMsg }) => {
  const copySql = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('SQL이 클립보드에 복사되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center gap-3 mb-6 text-red-400">
          <Icons.Refresh size={32} />
          <h1 className="text-2xl font-bold text-white">데이터베이스 연결 확인</h1>
        </div>
        
        {errorMsg && (
          <div className="bg-red-900/50 border border-red-800 p-3 rounded mb-6 text-sm font-mono text-red-200 break-all">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h3 className="text-white font-bold mb-2 flex justify-between items-center">
              <span>1. 처음 설치하는 경우 (전체 초기화)</span>
              <button onClick={() => copySql(SCHEMA_SQL)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors">
                복사하기
              </button>
            </h3>
            <pre className="text-xs text-slate-400 overflow-auto max-h-32 custom-scrollbar p-2 bg-black/30 rounded">
              {SCHEMA_SQL}
            </pre>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
             <h3 className="text-amber-400 font-bold mb-2 flex justify-between items-center">
              <span>2. 기존 데이터 유지 + 업데이트 (댓글/테마)</span>
              <button onClick={() => copySql(UPDATE_SQL)} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded transition-colors">
                복사하기
              </button>
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              이미 사이트를 사용 중이라면 이 쿼리를 실행하여 'character_comments' 테이블을 추가하고 테마 기본값을 설정하세요.
            </p>
            <pre className="text-xs text-slate-400 overflow-auto max-h-20 custom-scrollbar p-2 bg-black/30 rounded">
              {UPDATE_SQL}
            </pre>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div className="text-sm text-slate-400 bg-slate-700/30 p-4 rounded border border-slate-700">
            <strong>진행 방법:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>적절한 SQL(1번 또는 2번)을 <span className="text-blue-400">복사</span>하세요.</li>
              <li>Supabase 대시보드에서 <strong>SQL Editor</strong> 메뉴로 이동합니다.</li>
              <li>새 쿼리창에 붙여넣고 <strong>Run</strong>을 클릭하여 실행하세요.</li>
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