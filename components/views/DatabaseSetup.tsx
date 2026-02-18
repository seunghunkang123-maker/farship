
import React, { useState } from 'react';
import { Icons } from '../ui/Icons';
import { supabase } from '../../services/supabaseClient';

// 1. 초기 설치용 (깔끔한 상태)
const SCHEMA_SQL = `
-- UUID 확장 기능 활성화
create extension if not exists "uuid-ossp";

-- 1. 설정 테이블
create table if not exists settings (
  id int primary key generated always as identity,
  password text default '1234',
  global_backgrounds text[] default '{}'
);

-- 초기값이 없으면 추가
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

-- 4. 추가 파일 테이블
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

-- 5. 댓글 테이블
create table if not exists character_comments (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  user_name text not null,
  content text not null,
  style_variant text default 'NOTE',
  font text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS 활성화
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;
alter table character_comments enable row level security;

-- 정책 초기화 및 생성 (기존 정책 삭제 후 재생성하여 충돌 방지)
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

-- ★ 핵심: API 캐시 리로드
NOTIFY pgrst, 'reload config';
`;

// 2. 통합 업데이트/복구 SQL
const REPAIR_SQL = `
-- 1. 테이블이 아예 없는 경우를 대비해 테이블 생성 (IF NOT EXISTS)
create extension if not exists "uuid-ossp";

create table if not exists settings (
  id int primary key generated always as identity,
  password text default '1234',
  global_backgrounds text[] default '{}'
);

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  system text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists characters (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  name text not null,
  updated_at bigint default extract(epoch from now()) * 1000
);

create table if not exists extra_files (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  title text not null
);

create table if not exists character_comments (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  user_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. 컬럼 누락 확인 및 추가 (DO 블록 사용으로 에러 방지)
do $$
begin
  -- Settings
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='password') then
    alter table settings add column password text default '1234';
  end if;

  -- Campaigns
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='theme') then
    alter table campaigns add column theme text default 'ADVENTURE';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='alias_label') then
    alter table campaigns add column alias_label text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='sub_title') then
    alter table campaigns add column sub_title text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='logo_url') then
    alter table campaigns add column logo_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='background_images') then
    alter table campaigns add column background_images text[] default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='campaigns' and column_name='description') then
    alter table campaigns add column description text;
  end if;

  -- Characters
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='secret_profile') then
    alter table characters add column secret_profile jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='player_name') then
    alter table characters add column player_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='level_or_exp') then
    alter table characters add column level_or_exp text;
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
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='is_npc') then
    alter table characters add column is_npc boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='image_fit') then
    alter table characters add column image_fit text default 'cover';
  end if;
  -- Add other character bio fields if missing
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='age') then alter table characters add column age text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='gender') then alter table characters add column gender text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='height') then alter table characters add column height text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='weight') then alter table characters add column weight text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='appearance') then alter table characters add column appearance text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='dnd_class') then alter table characters add column dnd_class text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='cpred_role') then alter table characters add column cpred_role text; end if;
  if not exists (select 1 from information_schema.columns where table_name='characters' and column_name='custom_class') then alter table characters add column custom_class text; end if;

  -- Extra Files
  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='file_type') then
    alter table extra_files add column file_type text default 'REGULAR';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='combat_stats') then
    alter table extra_files add column combat_stats jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='image_fit') then
    alter table extra_files add column image_fit text default 'cover';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='content') then
    alter table extra_files add column content text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='extra_files' and column_name='image_url') then
    alter table extra_files add column image_url text;
  end if;

  -- Comments
  if not exists (select 1 from information_schema.columns where table_name='character_comments' and column_name='font') then
    alter table character_comments add column font text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='character_comments' and column_name='style_variant') then
    alter table character_comments add column style_variant text default 'NOTE';
  end if;
end $$;

-- 3. RLS 정책 재설정 (권한 문제 완벽 해결)
alter table settings enable row level security;
alter table campaigns enable row level security;
alter table characters enable row level security;
alter table extra_files enable row level security;
alter table character_comments enable row level security;

-- 기존 정책 삭제 (이름 충돌 방지)
drop policy if exists "Public Access Settings" on settings;
drop policy if exists "Public Access Campaigns" on campaigns;
drop policy if exists "Public Access Characters" on characters;
drop policy if exists "Public Access ExtraFiles" on extra_files;
drop policy if exists "Public Access Comments" on character_comments;

-- 새 정책 생성
create policy "Public Access Settings" on settings for all using (true) with check (true);
create policy "Public Access Campaigns" on campaigns for all using (true) with check (true);
create policy "Public Access Characters" on characters for all using (true) with check (true);
create policy "Public Access ExtraFiles" on extra_files for all using (true) with check (true);
create policy "Public Access Comments" on character_comments for all using (true) with check (true);

-- ★ 핵심: API 캐시 리로드
NOTIFY pgrst, 'reload config';
`;

interface Props {
  onRetry: () => void;
  errorMsg?: string;
}

const DatabaseSetup: React.FC<Props> = ({ onRetry, errorMsg }) => {
  const [activeTab, setActiveTab] = useState<'SQL' | 'IMPORT'>('SQL');
  
  // Data Import Inputs
  const [jsonCampaigns, setJsonCampaigns] = useState('');
  const [jsonCharacters, setJsonCharacters] = useState('');
  const [jsonFiles, setJsonFiles] = useState('');
  const [jsonComments, setJsonComments] = useState('');
  const [jsonSettings, setJsonSettings] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const copySql = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('SQL이 클립보드에 복사되었습니다. Supabase SQL Editor에서 실행해주세요.');
  };

  const handleImport = async () => {
    if (!confirm("이 작업은 현재 DB에 데이터를 덮어쓰거나 추가합니다. 진행하시겠습니까?")) return;
    
    setIsImporting(true);
    setImportStatus('데이터 분석 시작...');

    try {
      // 1. Settings (단일 행)
      if (jsonSettings.trim()) {
        const settings = JSON.parse(jsonSettings);
        // id를 제외하고 update 하거나 insert
        if (settings.length > 0) {
           const { id, ...rest } = settings[0];
           await supabase.from('settings').upsert(rest); // id 없이 insert하면 serial 증가, id 있으면 update
        }
      }

      // 2. Campaigns (부모)
      if (jsonCampaigns.trim()) {
        const campaigns = JSON.parse(jsonCampaigns);
        setImportStatus(`캠페인 ${campaigns.length}개 저장 중...`);
        const { error } = await supabase.from('campaigns').upsert(campaigns, { onConflict: 'id' });
        if (error) throw new Error(`Campaign Error: ${error.message}`);
      }

      // 3. Characters (자식)
      if (jsonCharacters.trim()) {
        const chars = JSON.parse(jsonCharacters);
        setImportStatus(`캐릭터 ${chars.length}명 저장 중...`);
        const { error } = await supabase.from('characters').upsert(chars, { onConflict: 'id' });
        if (error) throw new Error(`Character Error: ${error.message}`);
      }

      // 4. Files & Comments (손자)
      if (jsonFiles.trim()) {
        const files = JSON.parse(jsonFiles);
        setImportStatus(`파일 ${files.length}개 저장 중...`);
        const { error } = await supabase.from('extra_files').upsert(files, { onConflict: 'id' });
        if (error) throw new Error(`File Error: ${error.message}`);
      }

      if (jsonComments.trim()) {
        const comments = JSON.parse(jsonComments);
        setImportStatus(`댓글 ${comments.length}개 저장 중...`);
        const { error } = await supabase.from('character_comments').upsert(comments, { onConflict: 'id' });
        if (error) throw new Error(`Comment Error: ${error.message}`);
      }

      setImportStatus('✅ 모든 데이터 복원 완료! 3초 후 재시작합니다.');
      setTimeout(onRetry, 3000);

    } catch (e: any) {
      console.error(e);
      setImportStatus(`❌ 오류 발생: ${e.message}`);
      alert(`JSON 형식이 잘못되었거나 데이터베이스 제약 조건에 위배됩니다.\n(예: 캠페인을 먼저 넣지 않고 캐릭터를 넣음)\n\n${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl max-w-4xl w-full border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3 text-amber-500">
            <Icons.Settings size={32} />
            <h1 className="text-2xl font-bold text-white">데이터베이스 설정 & 마이그레이션</h1>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-lg">
             <button onClick={() => setActiveTab('SQL')} className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeTab === 'SQL' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>1. SQL 설정</button>
             <button onClick={() => setActiveTab('IMPORT')} className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeTab === 'IMPORT' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>2. 데이터 복원</button>
          </div>
        </div>
        
        {errorMsg && (
          <div className="bg-red-900/50 border border-red-800 p-3 rounded mb-6 text-sm font-mono text-red-200 break-all whitespace-pre-wrap">
            {errorMsg}
          </div>
        )}

        {activeTab === 'SQL' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <p className="text-slate-300 text-sm">
              새로운 Supabase 프로젝트(서울 리전)의 SQL Editor에서 아래 코드를 실행하여 테이블을 생성하세요.
            </p>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 ring-2 ring-amber-500/50">
               <h3 className="text-amber-400 font-bold mb-2 flex justify-between items-center">
                <span>🚀 통합 업데이트/복구 SQL</span>
                <button onClick={() => copySql(REPAIR_SQL)} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded transition-colors font-bold shadow-lg">
                  SQL 복사하기
                </button>
              </h3>
              <pre className="text-xs text-slate-400 overflow-auto max-h-60 custom-scrollbar p-2 bg-black/30 rounded font-mono">
                {REPAIR_SQL}
              </pre>
            </div>
            <button onClick={onRetry} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
              설정 완료 후 새로고침
            </button>
          </div>
        )}

        {activeTab === 'IMPORT' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg text-sm text-blue-200 mb-4">
                <strong>💡 사용법:</strong> 기존 Supabase 대시보드(Table Editor)에서 각 테이블을 
                <span className="font-bold text-white mx-1">Export as JSON</span>으로 다운로드한 뒤, 
                아래 해당 칸에 내용을 그대로 붙여넣으세요.
             </div>

             <div className="grid md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1">1. Campaigns (campaigns_rows.json)</label>
                   <textarea 
                     value={jsonCampaigns} onChange={e => setJsonCampaigns(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                     placeholder='[{"id": "...", "name": "..."}]' 
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1">2. Characters (characters_rows.json)</label>
                   <textarea 
                     value={jsonCharacters} onChange={e => setJsonCharacters(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                     placeholder='[{"id": "...", "name": "..."}]' 
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1">3. Extra Files (extra_files_rows.json)</label>
                   <textarea 
                     value={jsonFiles} onChange={e => setJsonFiles(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1">4. Comments (character_comments_rows.json)</label>
                   <textarea 
                     value={jsonComments} onChange={e => setJsonComments(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-400 mb-1">5. Settings (settings_rows.json) - 선택사항</label>
                   <textarea 
                     value={jsonSettings} onChange={e => setJsonSettings(e.target.value)} 
                     className="w-full h-16 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                   />
                </div>
             </div>

             <div className="pt-4 border-t border-slate-700">
                {importStatus && <div className="mb-4 text-center font-bold text-amber-400 animate-pulse">{importStatus}</div>}
                <button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className={`w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isImporting ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  {isImporting ? '데이터 복원 중...' : '데이터 복원 시작 (Restore Data)'}
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DatabaseSetup;
