
import { AppState, Campaign, Character, CharacterComment, ExtraFile, SystemType } from '../types';
import { supabase } from './supabaseClient';
import { INITIAL_STATE } from '../constants';

// --- DB 타입 매핑 인터페이스 ---
interface DbCharacter {
  id: string;
  campaign_id: string;
  name: string;
  real_name: string | null;
  player_name: string | null; // Added
  is_npc: boolean;
  image_url: string | null;
  image_fit: 'cover' | 'contain';
  summary: string | null;
  description: string | null;
  level_or_exp: string | null;
  
  // Bio Fields
  age: string | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  appearance: string | null;

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

interface DbComment {
  id: string;
  character_id: string;
  user_name: string;
  content: string;
  style_variant: string;
  font: string | null; // Added
  created_at: string;
}

interface DbCampaign {
  id: string;
  name: string;
  sub_title: string | null;
  system: string;
  logo_url: string | null;
  background_images: string[] | null;
  description: string | null;
  theme: string | null; // Added
}

// Helper: UUID 검증
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper: undefined -> null 변환 (DB 저장용)
const toDbValue = <T>(value: T | undefined): T | null => {
  return value === undefined ? null : value;
};

// --- DB 연결 확인 ---
export const checkDatabaseConnection = async () => {
  const { error } = await supabase.from('campaigns').select('id').limit(1);
  return error;
};

// --- 전체 상태 로딩 ---

export const loadFullState = async (): Promise<AppState> => {
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle(); 
    
    const { data: campaignsData, error: campError } = await supabase
      .from('campaigns')
      .select('*');

    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*');

    const { data: fileData, error: fileError } = await supabase
      .from('extra_files')
      .select('*');

    // Load Comments (new)
    const { data: commentData, error: commentError } = await supabase
      .from('character_comments')
      .select('*');

    if (settingsError && settingsError.code !== 'PGRST116') console.error('Settings Error:', settingsError);
    if (campError) console.error('Campaign Error:', campError);
    if (charError) console.error('Character Error:', charError);
    if (fileError) console.error('File Error:', fileError);
    // Ignore comment table missing error for backward compatibility
    if (commentError && commentError.code !== '42P01') console.error('Comment Error:', commentError);

    const campaigns: Campaign[] = (campaignsData || []).map((c: DbCampaign) => ({
      id: c.id,
      name: c.name,
      subTitle: c.sub_title || '',
      system: c.system as SystemType,
      logoUrl: c.logo_url || undefined,
      backgroundImages: c.background_images || [],
      description: c.description || undefined,
      theme: c.theme || undefined 
    }));

    const files = (fileData || []) as DbExtraFile[];
    const comments = (commentData || []) as DbComment[];

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

      const myComments: CharacterComment[] = comments
        .filter(cmt => cmt.character_id === c.id)
        .map(cmt => ({
          id: cmt.id,
          characterId: cmt.character_id,
          userName: cmt.user_name,
          content: cmt.content,
          styleVariant: (cmt.style_variant as any) || 'NOTE',
          font: cmt.font || undefined,
          createdAt: new Date(cmt.created_at).getTime()
        }));

      return {
        id: c.id,
        campaignId: c.campaign_id,
        name: c.name,
        realName: c.real_name || undefined,
        playerName: c.player_name || undefined, // Mapped
        isNpc: c.is_npc,
        imageUrl: c.image_url || undefined,
        imageFit: c.image_fit,
        summary: c.summary || '',
        description: c.description || undefined,
        levelOrExp: c.level_or_exp || undefined,
        
        // Bio Fields
        age: c.age || undefined,
        gender: c.gender || undefined,
        height: c.height || undefined,
        weight: c.weight || undefined,
        appearance: c.appearance || undefined,

        dndClass: c.dnd_class || undefined,
        dndSubclass: c.dnd_subclass || undefined,
        cpredRole: c.cpred_role || undefined,
        cpred_origin: c.cpred_origin || undefined,
        customClass: c.custom_class || undefined,
        customSubclass: c.custom_subclass || undefined,
        extraFiles: myFiles,
        comments: myComments,
        updatedAt: c.updated_at
      };
    });

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
    description: toDbValue(campaign.description),
    theme: toDbValue(campaign.theme)
  };

  const { error } = await supabase.from('campaigns').upsert(dbCamp);
  if (error) throw error;
};

export const deleteCampaign = async (id: string) => {
  if (!isUuid(id)) return;
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
};

export const saveCharacter = async (char: Character) => {
  if (!isUuid(char.id)) {
    throw new Error(`Invalid Character ID: ${char.id}`);
  }

  const dbChar = {
    id: char.id,
    campaign_id: char.campaignId,
    name: char.name,
    real_name: toDbValue(char.realName),
    player_name: toDbValue(char.playerName), // Mapped
    is_npc: char.isNpc,
    image_url: toDbValue(char.imageUrl),
    image_fit: char.imageFit,
    summary: toDbValue(char.summary),
    description: toDbValue(char.description),
    level_or_exp: toDbValue(char.levelOrExp),
    
    // Bio Fields
    age: toDbValue(char.age),
    gender: toDbValue(char.gender),
    height: toDbValue(char.height),
    weight: toDbValue(char.weight),
    appearance: toDbValue(char.appearance),

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
  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw error;
};

export const addComment = async (comment: CharacterComment) => {
  const dbComment = {
    id: comment.id,
    character_id: comment.characterId,
    user_name: comment.userName,
    content: comment.content,
    style_variant: comment.styleVariant,
    font: toDbValue(comment.font),
    created_at: new Date(comment.createdAt).toISOString()
  };
  
  const { error } = await supabase.from('character_comments').insert(dbComment);
  if (error) throw error;
};

export const deleteComment = async (id: string) => {
  const { error } = await supabase.from('character_comments').delete().eq('id', id);
  if (error) throw error;
};


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Increase limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      reject(new Error("이미지 파일 크기는 20MB 이하여야 합니다."));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
