
export enum SystemType {
  DND5E = 'DND5E',
  CYBERPUNK_RED = 'CPRED',
  COC7 = 'COC7',
  BAND_OF_BLADES = 'BAND_OF_BLADES',
  OTHER = 'OTHER'
}

export const CORE_MEMBERS = ['피쉬', '델리', '망령', '배추', '승훈', '유자'];

export interface CombatStat {
  name: string;
  value: number; // 1 to 5
}

export interface ExtraFile {
  id: string;
  title: string;
  content: string;
  imageUrl?: string; 
  useAsPortrait?: boolean; 
  isSecret?: boolean; 
  fileType?: 'REGULAR' | 'COMBAT';
  combatStats?: CombatStat[];
  imageFit?: 'cover' | 'contain';
}

export interface CharacterComment {
  id: string;
  characterId: string;
  userName: string;
  content: string;
  styleVariant: 'NOTE' | 'STAMP' | 'WARNING' | 'MEMO';
  font?: string;
  createdAt: number;
}

export interface CharacterAffiliation {
  id: string;
  name: string;
  rank?: string;
  isStrikethrough?: boolean;
  isHidden?: boolean;
}

export interface SecretProfile {
  name?: string;
  alias?: string;
  image_url?: string;
  summary?: string;
  description?: string;
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  appearance?: string;
  realName?: string;
  levelOrExp?: string;
  affiliations?: CharacterAffiliation[];
  extraFiles?: ExtraFile[];
  comments?: CharacterComment[];
}

export interface Character {
  id: string;
  campaignId: string;
  name: string; 
  alias?: string;
  isNameBlurred?: boolean;
  realName?: string;
  playerName?: string; 
  isNpc: boolean;
  imageUrl?: string; 
  imageFit: 'cover' | 'contain';
  summary: string; 
  description?: string; 
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  appearance?: string; 
  levelOrExp?: string; 
  affiliations?: CharacterAffiliation[];
  dndClass?: string;
  dndSubclass?: string;
  cpredRole?: string;
  cpredOrigin?: string;
  customClass?: string;    
  customSubclass?: string; 
  extraFiles: ExtraFile[];
  comments: CharacterComment[]; 
  secretProfile?: SecretProfile;
  updatedAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  subTitle?: string;
  system: SystemType;
  logoUrl?: string; 
  backgroundImages: string[]; 
  description?: string;
  theme?: string; 
  aliasLabel?: string;
}

export interface AppState {
  campaigns: Campaign[];
  characters: Character[];
  globalBackgrounds: string[];
  password: string; 
}

export const DND_CLASSES = [
  { label: '바바리안 (Barbarian)', value: 'Barbarian' },
  { label: '바드 (Bard)', value: 'Bard' },
  { label: '클레릭 (Cleric)', value: 'Cleric' },
  { label: '드루이드 (Druid)', value: 'Druid' },
  { label: '파이터 (Fighter)', value: 'Fighter' },
  { label: '몽크 (Monk)', value: 'Monk' },
  { label: '팔라딘 (Paladin)', value: 'Paladin' },
  { label: '레인저 (Ranger)', value: 'Ranger' },
  { label: '로그 (Rogue)', value: 'Rogue' },
  { label: '소서러 (Sorcerer)', value: 'Sorcerer' },
  { label: '워락 (Warlock)', value: 'Warlock' },
  { label: '위자드 (Wizard)', value: 'Wizard' },
  { label: '아티피서 (Artificer)', value: 'Artificer' },
];

export const CPRED_ROLES = [
  '로커보이 (Rockerboy)',
  '솔로 (Solo)',
  '넷러너 (Netrunner)',
  '테크 (Tech)',
  '메드텍 (Medtech)',
  '미디어 (Media)',
  '이그제큐티브 (Exec)',
  '로맨 (Lawman)',
  '픽서 (Fixer)',
  '노마드 (Nomad)',
];

export const BOB_PLAYBOOKS = [
  '지휘관 (Commander)',
  '마샬 (Marshal)',
  '쿼터마스터 (Quartermaster)',
  '스파이마스터 (Spymaster)',
  '로어키퍼 (Lorekeeper)',
  '중장보병 (Heavy)',
  '의무병 (Medic)',
  '정찰병 (Scout)',
  '저격수 (Sniper)',
  '신병 (Rookie)',
];

export interface TagItem {
  name: string;
  rank?: string;
  count?: number;
}

export interface ThemeConfig {
  name: string;
  classes: {
    bgMain: string;       
    bgPanel: string;      
    textMain: string;     
    textSub: string;      
    textAccent: string;   
    border: string;       
    buttonPrimary: string;
    buttonSecondary: string; 
    font?: string;        
    overlay?: string;     
  };
}
