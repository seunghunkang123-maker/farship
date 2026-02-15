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

// Helper: UUID 검증
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper: undefined -> null 변환 (DB 저장용)
const toDbValue = <T>(value: T | undefined): T | null => {
  return value === undefined ? null : value;
};

// --- 전체 상태 로딩 ---

export const loadFullState = async (): Promise<AppState> => {
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle(); // single() 대신 maybeSingle() 사용하여 0개 row일 때 에러 방지
    
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

    // DB가 비어있으면 초기 상태 반환하되, 초기 상태의 ID가 DB에 없을 수 있으므로 주의 필요
    // 하지만 읽기 전용으로 시작하므로 괜찮음.
    if (campaigns.length === 0 && (!settingsData || !settingsData.password)) {
       return INITIAL_STATE;
    }

    return {
      campaigns: campaigns,
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
    const { error } = await supabase.from('settings').update({
      password,
      global_backgrounds: globalBackgrounds
    }).eq('id', data[0].id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('settings').insert({
      password,
      global_backgrounds: globalBackgrounds
    });
    if (error) throw error;
  }
};

export const saveCampaign = async (campaign: Campaign) => {
  if (!isUuid(campaign.id)) {
    throw new Error(`Invalid Campaign ID: ${campaign.id}`);
  }

  const dbCamp = {
    id: campaign.id,
    name: campaign.name,
    sub_title: toDbValue(campaign.subTitle),
    system: campaign.system,
    logo_url: toDbValue(campaign.logoUrl),
    background_images: campaign.backgroundImages,
    description: toDbValue(campaign.description)
  };

  const { error } = await supabase.from('campaigns').upsert(dbCamp);
  if (error) throw error;
};

export const deleteCampaign = async (id: string) => {
  // 로컬 초기 데이터(Initial State)라서 DB에 없는 경우를 대비해 에러 무시하지 않음
  // 다만 UUID 형식이 아니면 DB 호출 방지
  if (!isUuid(id)) return;

  // ON DELETE CASCADE가 설정되어 있으므로 campaigns만 삭제하면 characters, extra_files 모두 자동 삭제됨.
  // 복잡한 수동 삭제 로직을 제거하여 트랜잭션 오류 및 권한 오류 방지.
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  
  if (error) throw error;
};

export const saveCharacter = async (char: Character) => {
  if (!isUuid(char.id)) {
    throw new Error(`Invalid Character ID: ${char.id}`);
  }

  // 1. 캐릭터 기본 정보 저장
  // undefined 값을 null로 변환하여 DB에 명시적으로 필드를 비우도록 함
  const dbChar = {
    id: char.id,
    campaign_id: char.campaignId,
    name: char.name,
    is_npc: char.isNpc,
    image_url: toDbValue(char.imageUrl),
    image_fit: char.imageFit,
    summary: toDbValue(char.summary),
    description: toDbValue(char.description),
    dnd_class: toDbValue(char.dndClass),
    dnd_subclass: toDbValue(char.dndSubclass),
    cpred_role: toDbValue(char.cpredRole),
    cpred_origin: toDbValue(char.cpredOrigin),
    custom_class: toDbValue(char.customClass),
    custom_subclass: toDbValue(char.customSubclass),
    updated_at: char.updatedAt
  };

  const { error: charError } = await supabase.from('characters').upsert(dbChar);
  if (charError) throw charError;

  // 2. 추가 파일 처리
  // 기존 파일 삭제 후 재등록
  const { error: deleteError } = await supabase.from('extra_files').delete().eq('character_id', char.id);
  if (deleteError) throw deleteError;

  if (char.extraFiles.length > 0) {
    const dbFiles = char.extraFiles.map(f => ({
      id: isUuid(f.id) ? f.id : crypto.randomUUID(),
      character_id: char.id,
      title: f.title,
      content: toDbValue(f.content),
      image_url: toDbValue(f.imageUrl),
      use_as_portrait: f.useAsPortrait,
      is_secret: f.isSecret
    }));

    const { error: fileError } = await supabase.from('extra_files').insert(dbFiles);
    if (fileError) throw fileError;
  }
};

export const deleteCharacter = async (id: string) => {
  if (!isUuid(id)) return;

  // ON DELETE CASCADE가 설정되어 있으므로 캐릭터만 삭제하면 파일도 자동 삭제됨
  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw error;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 5MB 용량 제한 체크 (Supabase 및 HTTP 요청 크기 제한 고려)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("이미지 파일 크기는 5MB 이하여야 합니다."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};