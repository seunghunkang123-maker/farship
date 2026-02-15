import { AppState, Campaign, Character, ExtraFile, SystemType } from '../types';
import { supabase } from './supabaseClient';
import { INITIAL_STATE } from '../constants';

// --- DB 타입 매핑 인터페이스 ---
// Supabase 테이블의 컬럼명(snake_case)과 매칭
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

// --- 전체 상태 로딩 ---

export const loadFullState = async (): Promise<AppState> => {
  try {
    // 1. Settings (비밀번호, 배경)
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    // 2. Campaigns
    const { data: campaignsData, error: campError } = await supabase
      .from('campaigns')
      .select('*');

    // 3. Characters
    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*');

    // 4. Extra Files
    const { data: fileData, error: fileError } = await supabase
      .from('extra_files')
      .select('*');

    if (settingsError && settingsError.code !== 'PGRST116') console.error('Settings Error:', settingsError);
    if (campError) console.error('Campaign Error:', campError);
    if (charError) console.error('Character Error:', charError);
    if (fileError) console.error('File Error:', fileError);

    // DB 데이터를 앱 상태로 변환
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
      // 해당 캐릭터의 추가 파일 필터링
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
  // 설정 테이블은 단일 행으로 관리 (ID 1 또는 첫 번째 행)
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
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
};

export const saveCharacter = async (char: Character) => {
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
  // 기존 파일들을 삭제하고 현재 상태로 다시 저장 (복잡한 diff 방지)
  await supabase.from('extra_files').delete().eq('character_id', char.id);

  if (char.extraFiles.length > 0) {
    const dbFiles = char.extraFiles.map(f => ({
      id: f.id,
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
  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw error;
};

// 유틸리티: File -> Base64 (이미지 업로드용)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};