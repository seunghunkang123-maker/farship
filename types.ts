
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
  isSecret?: boolean; // If true, content is hidden until revealed
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

export interface Character {
  id: string;
  campaignId: string;
  name: string; // Used as "Handle" in Cyberpunk
  realName?: string; // New: Real Name / Secret Identity
  playerName?: string; // New: Player Name (Member or Guest)
  isNpc: boolean;
  imageUrl?: string; // Base64 or URL
  imageFit: 'cover' | 'contain';
  summary: string; // One line summary
  description?: string; // Detailed bio
  
  // New Physical/Bio Fields
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  appearance?: string; // Short visual description

  levelOrExp?: string; // Level, Rank, Age, etc.

  // DnD Specific
  dndClass?: string;
  dndSubclass?: string;
  
  // Cyberpunk Specific
  cpredRole?: string;
  cpredOrigin?: string;

  // Other / Custom System Specific
  customClass?: string;    // Main Role/Class/Job
  customSubclass?: string; // Sub Role/Race/Origin
  
  // Common Extra Fields
  extraFiles: ExtraFile[];
  comments: CharacterComment[]; // Added Comments
  updatedAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  subTitle?: string;
  system: SystemType;
  logoUrl?: string; // Base64 or URL
  backgroundImages: string[]; // Array of Base64 or URLs
  description?: string;
  theme?: string; // New: UI Theme Key
}

export interface AppState {
  campaigns: Campaign[];
  characters: Character[];
  globalBackgrounds: string[];
  password: string; // Ideally hashed, but raw for this demo
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
    bgMain: string;       // Main container background (usually transparent/glass)
    bgPanel: string;      // Panel/Card background
    textMain: string;     // Primary Text
    textSub: string;      // Secondary Text
    textAccent: string;   // Highlight/Link Text
    border: string;       // Border color
    buttonPrimary: string;// Primary Button
    buttonSecondary: string; // Secondary/Icon Button
    font?: string;        // Optional font family utility
    overlay?: string;     // Optional overlay for atmosphere
  };
}
