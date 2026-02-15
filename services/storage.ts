import { AppState, Campaign, Character, ExtraFile, SystemType } from '../types';
import { supabase } from './supabaseClient';
import { INITIAL_STATE } from '../constants';

// --- DB 타입 매핑 인터페이스 ---
interface DbCharacter {
  id: string;
  campaign_id: string;
  name: string;
  is_npc: boolean;
  image_url: string | null;
  image_fit: 'cover' | 'contain';
  summary: string | null;
  description: string | null;
  dnd_class: string | null;
  dnd_subclass: string | null;
  cpred_role: string | null;
  cpred_origin: string | null;
  custom_class: string | null;
  custom_subclass: string | null;
  updated_at: number;
}

interface DbExtraFile {
  id: string;
  character_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  use_as_portrait: boolean;
  is_secret: boolean;
}

interface DbCampaign {
  id: string;
  name: string;
  sub_title: string | null;
  system: string;
  logo_url: string | null;
  background_images: string[] | null;
  description: string | null;
}

// Helper: UUID 검증 (DB 오류 방지)
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// --- 전체 상태 로딩 ---

export const loadFullState = async (): Promise<AppState> => {
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    const { data: campaignsData, error: campError } = await supabase
      .from('campaigns')
      .select('*');

    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*');

    const { data: fileData, error: fileError } = await supabase
      .from('extra_files')
      .select('*');

    if (settingsError && settingsError.code !== 'PGRST116') console.error('Settings Error:', settingsError);
    if (campError) console.error('Campaign Error:', campError);
    if (charError) console.error('Character Error:', charError);
    if (fileError) console.error('File Error:', fileError);

    const campaigns: Campaign[] = (campaignsData || []).map((c: DbCampaign) => ({
      id: c.id,
      name: c.name,
      subTitle: c.sub_title || '',
      system: c.system as SystemType,
      logoUrl: c.logo_url || undefined,
      backgroundImages: c.background_images || [],
      description: c.description || undefined
    }));

    const files = (fileData || []) as DbExtraFile[];

    const characters: Character[] = (charData || []).map((c: DbCharacter) => {
      const myFiles: ExtraFile[] = files
        .filter(f => f.character_id === c.id)
        .map(f => ({
          id: f.id,
          title: f.title,
          content: f.content || '',
          imageUrl: f.image_url || undefined,
          useAsPortrait: f.use_as_portrait,
          isSecret: f.is_secret
        }));

      return {
        id: c.id,
        campaignId: c.campaign_id,
        name: c.name,
        isNpc: c.is_npc,
        imageUrl: c.image_url || undefined,
        imageFit: c.image_fit,
        summary: c.summary || '',
        description: c.description || undefined,
        dndClass: c.dnd_class || undefined,
        dndSubclass: c.dnd_subclass || undefined,
        cpredRole: c.cpred_role || undefined,
        cpredOrigin: c.cpred_origin || undefined,
        customClass: c.custom_class || undefined,
        customSubclass: c.custom_subclass || undefined,
        extraFiles: myFiles,
        updatedAt: c.updated_at
      };
    });

    return {
      campaigns: campaigns.length > 0 ? campaigns : INITIAL_STATE.campaigns,
      characters: characters,
      globalBackgrounds: settingsData?.global_backgrounds || INITIAL_STATE.globalBackgrounds,
      password: settingsData?.password || INITIAL_STATE.password
    };

  } catch (err) {
    console.error("Critical error loading state:", err);
    return INITIAL_STATE;
  }
};

// --- 저장/삭제 작업 (CRUD) ---

export const saveSettings = async (password: string, globalBackgrounds: string[]) => {
  const { data } = await supabase.from('settings').select('id').limit(1);
  
  if (data && data.length > 0) {
    await supabase.from('settings').update({
      password,
      global_backgrounds: globalBackgrounds
    }).eq('id', data[0].id);
  } else {
    await supabase.from('settings').insert({
      password,
      global_backgrounds: globalBackgrounds
    });
  }
};

export const saveCampaign = async (campaign: Campaign) => {
  // UUID가 아닌 경우(레거시 데이터) 저장 건너뛰기
  if (!isUuid(campaign.id)) return;

  const dbCamp = {
    id: campaign.id,
    name: campaign.name,
    sub_title: campaign.subTitle,
    system: campaign.system,
    logo_url: campaign.logoUrl,
    background_images: campaign.backgroundImages,
    description: campaign.description
  };

  const { error } = await supabase.from('campaigns').upsert(dbCamp);
  if (error) throw error;
};

export const deleteCampaign = async (id: string) => {
  // 1. UUID 검증: 로컬 더미 데이터라면 DB 요청 없이 종료 (성공 처리)
  if (!isUuid(id)) return;

  // 2. 수동 Cascade: 하위 데이터를 명시적으로 먼저 삭제 (DB 제약조건 오류 방지)
  try {
    // 캠페인에 속한 캐릭터 ID 조회
    const { data: chars } = await supabase.from('characters').select('id').eq('campaign_id', id);
    
    if (chars && chars.length > 0) {
      const charIds = chars.map(c => c.id);
      
      // 캐릭터에 속한 추가 파일 삭제
      await supabase.from('extra_files').delete().in('character_id', charIds);
      
      // 캐릭터 삭제
      await supabase.from('characters').delete().eq('campaign_id', id);
    }
  } catch (e) {
    console.warn("Cascade delete warning:", e);
    // 계속 진행 (DB 레벨 Cascade가 있을 수 있음)
  }

  // 3. 캠페인 삭제
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
};

export const saveCharacter = async (char: Character) => {
  if (!isUuid(char.id)) return;

  // 1. 캐릭터 기본 정보 저장
  const dbChar = {
    id: char.id,
    campaign_id: char.campaignId,
    name: char.name,
    is_npc: char.isNpc,
    image_url: char.imageUrl,
    image_fit: char.imageFit,
    summary: char.summary,
    description: char.description,
    dnd_class: char.dndClass,
    dnd_subclass: char.dndSubclass,
    cpred_role: char.cpredRole,
    cpred_origin: char.cpredOrigin,
    custom_class: char.customClass,
    custom_subclass: char.customSubclass,
    updated_at: char.updatedAt
  };

  const { error: charError } = await supabase.from('characters').upsert(dbChar);
  if (charError) throw charError;

  // 2. 추가 파일 처리
  await supabase.from('extra_files').delete().eq('character_id', char.id);

  if (char.extraFiles.length > 0) {
    const dbFiles = char.extraFiles.map(f => ({
      id: isUuid(f.id) ? f.id : crypto.randomUUID(), // 파일 ID도 UUID 보장
      character_id: char.id,
      title: f.title,
      content: f.content,
      image_url: f.imageUrl,
      use_as_portrait: f.useAsPortrait,
      is_secret: f.isSecret
    }));

    const { error: fileError } = await supabase.from('extra_files').insert(dbFiles);
    if (fileError) throw fileError;
  }
};

export const deleteCharacter = async (id: string) => {
  if (!isUuid(id)) return;

  // 수동 Cascade: 파일 먼저 삭제
  await supabase.from('extra_files').delete().eq('character_id', id);

  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw error;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};