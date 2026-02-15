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
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. 캐릭터 테이블
create table if not exists characters (
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
create table if not exists extra_files (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  title text not null,
  content text,
  image_url text,
  use_as_portrait boolean default false,
  is_secret boolean default false
);

-- RLS (Row Level Security) 설정
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;

-- 정책 생성 (기존 충돌 방지 위해 drop 후 생성)
drop policy if exists "Public Access Settings" on settings;
create policy "Public Access Settings" on settings for all using (true) with check (true);

drop policy if exists "Public Access Campaigns" on campaigns;
create policy "Public Access Campaigns" on campaigns for all using (true) with check (true);

drop policy if exists "Public Access Characters" on characters;
create policy "Public Access Characters" on characters for all using (true) with check (true);

drop policy if exists "Public Access ExtraFiles" on extra_files;
create policy "Public Access ExtraFiles" on extra_files for all using (true) with check (true);
`;

interface Props {
  onRetry: () => void;
  errorMsg?: string;
}

const DatabaseSetup: React.FC<Props> = ({ onRetry, errorMsg }) => {
  const copySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    alert('SQL이 클립보드에 복사되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 text-red-400">
          <Icons.Refresh size={32} />
          <h1 className="text-2xl font-bold text-white">데이터베이스 연결 오류</h1>
        </div>
        
        <p className="text-slate-300 mb-4">
          Supabase 데이터베이스에서 <strong>테이블을 찾을 수 없습니다.</strong><br/>
          아직 테이블을 생성하지 않았을 가능성이 높습니다.
        </p>

        {errorMsg && (
          <div className="bg-red-900/50 border border-red-800 p-3 rounded mb-6 text-sm font-mono text-red-200 break-all">
            {errorMsg}
          </div>
        )}

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6">
          <h3 className="text-white font-bold mb-2 flex justify-between items-center">
            <span>SQL 초기화 스크립트</span>
            <button onClick={copySql} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors">
              복사하기
            </button>
          </h3>
          <pre className="text-xs text-slate-400 overflow-auto max-h-48 custom-scrollbar p-2 bg-black/30 rounded">
            {SCHEMA_SQL}
          </pre>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-slate-400 bg-slate-700/30 p-4 rounded border border-slate-700">
            <strong>해결 방법:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>위 <span className="text-blue-400">복사하기</span> 버튼을 누르세요.</li>
              <li>Supabase 대시보드에서 <strong>SQL Editor</strong> 메뉴로 이동합니다.</li>
              <li>새 쿼리창에 붙여넣고 <strong>Run</strong>을 클릭하여 테이블을 생성하세요.</li>
              <li>생성이 완료되면 아래 버튼을 눌러주세요.</li>
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