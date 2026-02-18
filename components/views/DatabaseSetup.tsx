
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

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>, setJson: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setJson(event.target.result);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Helper to parse potential different JSON structures
  const parseJSON = (jsonString: string, label: string) => {
    try {
      if (!jsonString.trim()) return [];
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) return data;
      // Handle cases where export might be { rows: [...] } or similar
      if (data && Array.isArray(data.rows)) return data.rows;
      if (data && typeof data === 'object') return [data]; // Single object
      return [];
    } catch (e) {
      throw new Error(`[${label}] JSON 파싱 실패: 형식이 올바르지 않습니다.`);
    }
  };

  // Batch upsert function to avoid "Failed to fetch" (Payload too large)
  const upsertBatched = async (table: string, data: any[], batchSize = 50, onProgress: (msg: string) => void) => {
    if (!data || data.length === 0) return;
    
    const total = data.length;
    for (let i = 0; i < total; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      onProgress(`${table} 저장 중... (${Math.min(i + batchSize, total)}/${total})`);
      
      const { error } = await supabase.from(table).upsert(batch);
      if (error) {
         console.error(`Error importing ${table} batch ${i}:`, error);
         throw new Error(`[${table}] 저장 실패: ${error.message} (Row ${i+1}~${i+batch.length})`);
      }
    }
  };

  const handleImport = async () => {
    if (!confirm("이 작업은 현재 DB에 데이터를 덮어쓰거나 추가합니다. 진행하시겠습니까?")) return;
    
    setIsImporting(true);
    setImportStatus('데이터 분석 시작...');

    try {
      // 1. Settings (단일 행 처리가 안전)
      if (jsonSettings.trim()) {
        const settings = parseJSON(jsonSettings, 'Settings');
        if (settings.length > 0) {
           const row = settings[0];
           const { id, ...rest } = row;
           const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();
           
           if (existing) {
             const { error } = await supabase.from('settings').update(rest).eq('id', existing.id);
             if (error) throw new Error(`Settings Update Error: ${error.message}`);
           } else {
             const { error } = await supabase.from('settings').insert(row);
             if (error) throw new Error(`Settings Insert Error: ${error.message}`);
           }
        }
      }

      // 2. Campaigns (Batch size 10 - 캠페인에도 로고 이미지가 있을 수 있음)
      if (jsonCampaigns.trim()) {
        const campaigns = parseJSON(jsonCampaigns, 'Campaigns');
        if (campaigns.length > 0) {
           await upsertBatched('campaigns', campaigns, 10, setImportStatus);
        }
      }

      // 3. Characters (Batch size 20)
      if (jsonCharacters.trim()) {
        const characters = parseJSON(jsonCharacters, 'Characters');
        if (characters.length > 0) {
           await upsertBatched('characters', characters, 20, setImportStatus);
        }
      }

      // 4. Files (Batch size 5 - 이미지가 포함되어 있어 매우 무거울 수 있음)
      if (jsonFiles.trim()) {
        const files = parseJSON(jsonFiles, 'Files');
        if (files.length > 0) {
           await upsertBatched('extra_files', files, 5, setImportStatus);
        }
      }

      // 5. Comments (Batch size 50)
      if (jsonComments.trim()) {
        const comments = parseJSON(jsonComments, 'Comments');
        if (comments.length > 0) {
           await upsertBatched('character_comments', comments, 50, setImportStatus);
        }
      }

      setImportStatus('✅ 모든 데이터 복원 완료! 3초 후 재시작합니다.');
      setTimeout(onRetry, 3000);

    } catch (e: any) {
      console.error(e);
      setImportStatus(`❌ 오류 발생: ${e.message}`);
      alert(`복원 중 오류가 발생했습니다.\n데이터 양이 많을 수 있으니 잠시 기다렸다 다시 시도해보세요.\n\n${e.message}`);
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
          <div className="flex bg-slate-900 p-1 rounded-lg shrink-0">
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
                아래 해당 칸에 내용을 그대로 붙여넣거나 파일을 업로드하세요.
             </div>

             <div className="grid md:grid-cols-2 gap-4">
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400">1. Campaigns (campaigns_rows.json)</label>
                      <label className="cursor-pointer flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600 transition-colors">
                         <Icons.Upload size={12} />
                         <span className="text-[10px] font-bold">파일 선택</span>
                         <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileRead(e, setJsonCampaigns)} />
                      </label>
                   </div>
                   <textarea 
                     value={jsonCampaigns} onChange={e => setJsonCampaigns(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                     placeholder='[{"id": "...", "name": "..."}]' 
                   />
                </div>
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400">2. Characters (characters_rows.json)</label>
                      <label className="cursor-pointer flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600 transition-colors">
                         <Icons.Upload size={12} />
                         <span className="text-[10px] font-bold">파일 선택</span>
                         <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileRead(e, setJsonCharacters)} />
                      </label>
                   </div>
                   <textarea 
                     value={jsonCharacters} onChange={e => setJsonCharacters(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                     placeholder='[{"id": "...", "name": "..."}]' 
                   />
                </div>
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400">3. Extra Files (extra_files_rows.json)</label>
                      <label className="cursor-pointer flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600 transition-colors">
                         <Icons.Upload size={12} />
                         <span className="text-[10px] font-bold">파일 선택</span>
                         <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileRead(e, setJsonFiles)} />
                      </label>
                   </div>
                   <textarea 
                     value={jsonFiles} onChange={e => setJsonFiles(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                   />
                </div>
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400">4. Comments (character_comments_rows.json)</label>
                      <label className="cursor-pointer flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600 transition-colors">
                         <Icons.Upload size={12} />
                         <span className="text-[10px] font-bold">파일 선택</span>
                         <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileRead(e, setJsonComments)} />
                      </label>
                   </div>
                   <textarea 
                     value={jsonComments} onChange={e => setJsonComments(e.target.value)} 
                     className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none" 
                   />
                </div>
                <div className="md:col-span-2">
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400">5. Settings (settings_rows.json) - 선택사항</label>
                      <label className="cursor-pointer flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600 transition-colors">
                         <Icons.Upload size={12} />
                         <span className="text-[10px] font-bold">파일 선택</span>
                         <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileRead(e, setJsonSettings)} />
                      </label>
                   </div>
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
