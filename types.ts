
export enum SystemType {
  DND5E = 'DND5E',
  CYBERPUNK_RED = 'CPRED',
  COC7 = 'COC7',
  BAND_OF_BLADES = 'BAND_OF_BLADES',
  OTHER = 'OTHER'
}

export const CORE_MEMBERS = ['피쉬', '델리', '망령', '배추', '승훈', '유자'];

export interface ExtraFile {
  id: string;
  title: string;
  content: string;
  imageUrl?: string; // Image support for secrets/clues
  useAsPortrait?: boolean; // If true, this image overrides the main character portrait
  isSecret?: boolean; // Legacy field (still useful for hiding individual items in public mode)
}

export interface CharacterComment {
  id: string;
  characterId: string;
  userName: string;
  content: string;
  styleVariant: 'NOTE' | 'STAMP' | 'WARNING' | 'MEMO'; // UI style
  font?: string; // New: Custom font selection ('HAND', 'SERIF', 'MONO', 'SANS', 'BOLD')
  createdAt: number;
}

// New: Affiliation Structure
export interface CharacterAffiliation {
  id: string;
  name: string;
  rank?: string; // Optional Rank/Position
  isStrikethrough?: boolean; // 취소선 여부 (탈퇴, 전직 등 표현)
  isHidden?: boolean; // New: 숨김 여부 (비밀 모드에서 공개 태그를 가리기 위함)
}

// Secret Profile Structure (Expanded)
export interface SecretProfile {
  name?: string; // Secret Name / Real Name when revealed
  alias?: string; // New: Secret Alias
  image_url?: string;
  summary?: string;
  description?: string;
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  appearance?: string;
  realName?: string; // Legacy field support
  
  // New: Secret Mode specific data
  levelOrExp?: string;
  affiliations?: CharacterAffiliation[]; // Secret Affiliations 
  extraFiles?: ExtraFile[]; // Separate list for secret mode
  comments?: CharacterComment[]; // Separate list for secret mode
}

export interface Character {
  id: string;
  campaignId: string;
  name: string; 
  
  // New: Universal Alias System
  alias?: string; // 이명, 칭호, 핸들 등
  isNameBlurred?: boolean; // 이명 존재 시 본명 블러 처리 여부

  realName?: string; // Legacy: Can be used as subtitle or secondary name
  playerName?: string; 
  isNpc: boolean;
  imageUrl?: string; 
  imageFit: 'cover' | 'contain';
  summary: string; 
  description?: string; 
  
  // New Physical/Bio Fields
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  appearance?: string; 

  levelOrExp?: string; 
  
  // New: Affiliations (Groups/Organizations)
  affiliations?: CharacterAffiliation[];

  // DnD Specific
  dndClass?: string;
  dndSubclass?: string;
  
  // Cyberpunk Specific
  cpredRole?: string;
  cpredOrigin?: string;

  // Other / Custom System Specific
  customClass?: string;    
  customSubclass?: string; 
  
  // Common Extra Fields
  extraFiles: ExtraFile[];
  comments: CharacterComment[]; 
  
  // Secret Profile Object (Hidden by default)
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
  
  // New: Custom Label for "Alias" field (e.g., "Handle", "Code Name")
  aliasLabel?: string;
}

export interface AppState {
  campaigns: Campaign[];
  characters: Character[];
  globalBackgrounds: string[];
  password: string; 
}

// DnD Class Constants
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

// --- Theme Definition Type ---
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
