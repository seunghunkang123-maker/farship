
import { AppState, Campaign, Character, CharacterComment, ExtraFile, SecretProfile, SystemType, CharacterAffiliation, CombatStat } from '../types';
import { supabase } from './supabaseClient';
import { INITIAL_STATE } from '../constants';

interface DbCharacter {
  id: string;
  campaign_id: string;
  name: string;
  alias: string | null;
  is_name_blurred: boolean;
  real_name: string | null;
  player_name: string | null; 
  is_npc: boolean;
  image_url: string | null;
  image_fit: 'cover' | 'contain';
  summary: string | null;
  description: string | null;
  level_or_exp: string | null;
  affiliations: CharacterAffiliation[] | null;
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
  secret_profile: SecretProfile | null; 
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
  file_type: 'REGULAR' | 'COMBAT' | null;
  combat_stats: CombatStat[] | null;
  image_fit: 'cover' | 'contain' | null;
}

interface DbComment {
  id: string;
  character_id: string;
  user_name: string;
  content: string;
  style_variant: string;
  font: string | null;
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
  theme: string | null;
  alias_label: string | null;
}

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const toDbValue = <T>(value: T | undefined): T | null => {
  return value === undefined ? null : value;
};

// --- Helper: Batched Fetching ---
// Fetches data in small chunks to avoid statement timeouts with large datasets (e.g. Base64 images)
const fetchBatched = async <T>(table: string, pageSize = 20): Promise<T[]> => {
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  // Safety break to prevent infinite loops in weird edge cases
  const MAX_PAGES = 500; 

  while (hasMore && page < MAX_PAGES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true }) // Stable sort is required for pagination
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data as unknown as T[]];
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }
  return allData;
};

// --- Realtime Subscription ---
export const subscribeToChanges = (onUpdate: () => void) => {
  const channel = supabase.channel('public-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        // console.log('Realtime change received:', payload);
        onUpdate();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to Supabase Realtime');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

export const checkDatabaseConnection = async () => {
  const { error } = await supabase.from('campaigns').select('id').limit(1);
  return error;
};

export const loadFullState = async (): Promise<AppState> => {
  // CRITICAL: Do NOT return INITIAL_STATE on catch. Throw error to let the caller handle it.
  // This prevents the UI from flashing "No Data" when a request fails temporarily.

  const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').maybeSingle(); 
  
  const { data: campaignsData, error: campError } = await supabase.from('campaigns').select('*');
  if (campError) throw new Error(`Campaign Load Failed: ${campError.message}`);

  // Use batched fetching for heavy tables with REDUCED batch size to prevent timeouts
  let charData: DbCharacter[] = [];
  try {
    charData = await fetchBatched<DbCharacter>('characters', 4); // Reduced from 20 to 4
  } catch (e: any) {
    throw new Error(`Character Load Failed: ${e.message}`);
  }

  let fileData: DbExtraFile[] = [];
  try {
    fileData = await fetchBatched<DbExtraFile>('extra_files', 5); // Reduced from 15 to 5
  } catch (e: any) {
    throw new Error(`File Load Failed: ${e.message}`);
  }

  // Comments are usually text-only, simple fetch is fine
  const { data: commentData, error: commentError } = await supabase.from('character_comments').select('*');
  if (commentError && commentError.code !== '42P01') throw new Error(`Comment Load Failed: ${commentError.message}`);

  if (settingsError && settingsError.code !== 'PGRST116') console.warn('Settings Warning:', settingsError);

  const campaigns: Campaign[] = (campaignsData || []).map((c: DbCampaign) => ({
    id: c.id,
    name: c.name,
    subTitle: c.sub_title || '',
    system: c.system as SystemType,
    logoUrl: c.logo_url || undefined,
    backgroundImages: c.background_images || [],
    description: c.description || undefined,
    theme: c.theme || undefined,
    aliasLabel: c.alias_label || undefined
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
        isSecret: f.is_secret,
        fileType: f.file_type || 'REGULAR',
        combatStats: f.combat_stats || [],
        imageFit: f.image_fit || 'cover'
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
      alias: c.alias || undefined,
      isNameBlurred: c.is_name_blurred || false,
      realName: c.real_name || undefined,
      playerName: c.player_name || undefined,
      isNpc: c.is_npc,
      imageUrl: c.image_url || undefined,
      imageFit: c.image_fit,
      summary: c.summary || '',
      description: c.description || undefined,
      levelOrExp: c.level_or_exp || undefined,
      affiliations: c.affiliations || [],
      age: c.age || undefined,
      gender: c.gender || undefined,
      height: c.height || undefined,
      weight: c.weight || undefined,
      appearance: c.appearance || undefined,
      dndClass: c.dnd_class || undefined,
      dndSubclass: c.dnd_subclass || undefined,
      cpredRole: c.cpred_role || undefined,
      cpredOrigin: c.cpred_origin || undefined,
      customClass: c.custom_class || undefined,
      customSubclass: c.custom_subclass || undefined,
      secretProfile: c.secret_profile || undefined, 
      extraFiles: myFiles,
      comments: myComments,
      updatedAt: c.updated_at
    };
  });

  // Only return INITIAL_STATE if specifically configured (no campaigns in DB AND no settings)
  // This distinguishes "Empty DB" from "Failed Fetch"
  if (campaigns.length === 0 && (!settingsData || !settingsData.password)) {
      return INITIAL_STATE;
  }

  return {
    campaigns,
    characters,
    globalBackgrounds: settingsData?.global_backgrounds || INITIAL_STATE.globalBackgrounds,
    password: settingsData?.password || INITIAL_STATE.password
  };
};

export const saveSettings = async (password: string, globalBackgrounds: string[]) => {
  const { data } = await supabase.from('settings').select('id').limit(1);
  if (data && data.length > 0) {
    await supabase.from('settings').update({ password, global_backgrounds: globalBackgrounds }).eq('id', data[0].id);
  } else {
    await supabase.from('settings').insert({ password, global_backgrounds: globalBackgrounds });
  }
};

export const saveCampaign = async (campaign: Campaign) => {
  if (!isUuid(campaign.id)) throw new Error(`Invalid Campaign ID: ${campaign.id}`);
  const dbCamp = {
    id: campaign.id,
    name: campaign.name,
    sub_title: toDbValue(campaign.subTitle),
    system: campaign.system,
    logo_url: toDbValue(campaign.logoUrl),
    background_images: campaign.backgroundImages,
    description: toDbValue(campaign.description),
    theme: toDbValue(campaign.theme),
    alias_label: toDbValue(campaign.aliasLabel)
  };
  await supabase.from('campaigns').upsert(dbCamp);
};

export const deleteCampaign = async (id: string) => {
  if (!isUuid(id)) return;
  await supabase.from('campaigns').delete().eq('id', id);
};

export const saveCharacter = async (char: Character) => {
  if (!isUuid(char.id)) throw new Error(`Invalid Character ID: ${char.id}`);

  const dbChar = {
    id: char.id,
    campaign_id: char.campaignId,
    name: char.name,
    alias: toDbValue(char.alias),
    is_name_blurred: char.isNameBlurred,
    real_name: toDbValue(char.realName),
    player_name: toDbValue(char.playerName),
    is_npc: char.isNpc,
    image_url: toDbValue(char.imageUrl),
    image_fit: char.imageFit,
    summary: toDbValue(char.summary),
    description: toDbValue(char.description),
    level_or_exp: toDbValue(char.levelOrExp),
    affiliations: char.affiliations && char.affiliations.length > 0 ? char.affiliations : null,
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
    secret_profile: toDbValue(char.secretProfile), 
    updated_at: char.updatedAt
  };

  const { error: charError } = await supabase.from('characters').upsert(dbChar);
  if (charError) throw charError;

  // Safer File Sync: Delete only what needs to be deleted, Insert only new/updated
  await supabase.from('extra_files').delete().eq('character_id', char.id);

  if (char.extraFiles.length > 0) {
    const dbFiles = char.extraFiles.map(f => ({
      id: isUuid(f.id) ? f.id : crypto.randomUUID(),
      character_id: char.id,
      title: f.title,
      content: toDbValue(f.content),
      image_url: toDbValue(f.imageUrl),
      use_as_portrait: !!f.useAsPortrait,
      is_secret: !!f.isSecret,
      file_type: f.fileType || 'REGULAR',
      combat_stats: f.combatStats || [],
      image_fit: f.imageFit || 'cover'
    }));
    const { error: fileError } = await supabase.from('extra_files').insert(dbFiles);
    if (fileError) throw fileError;
  }
};

export const deleteCharacter = async (id: string) => {
  if (!isUuid(id)) return;
  await supabase.from('characters').delete().eq('id', id);
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
  await supabase.from('character_comments').insert(dbComment);
};

export const updateComment = async (comment: CharacterComment) => {
  const dbComment = {
    user_name: comment.userName,
    content: comment.content,
    style_variant: comment.styleVariant,
    font: toDbValue(comment.font),
    created_at: new Date(comment.createdAt).toISOString() // Now updates date as well
  };
  await supabase.from('character_comments').update(dbComment).eq('id', comment.id);
};

export const deleteComment = async (id: string) => {
  await supabase.from('character_comments').delete().eq('id', id);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
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
