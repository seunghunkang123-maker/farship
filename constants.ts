import { Campaign, SystemType, AppState, ThemeConfig } from './types';

export const THEME_KEYS = {
  ADVENTURE: 'ADVENTURE',
  GOTHIC: 'GOTHIC',
  CYBERPUNK: 'CYBERPUNK',
  NOIR: 'NOIR',
  MILITARY: 'MILITARY',
  SCIFI: 'SCIFI',
  MINIMAL: 'MINIMAL',
};

export const THEMES: Record<string, ThemeConfig> = {
  [THEME_KEYS.ADVENTURE]: {
    name: '🏹 모험 (Adventure)',
    classes: {
      // 따뜻한 웜톤 계열의 다크 모드 (Stone/Orange/Amber) - 기존 유지
      bgMain: 'bg-[#1c1917]', // Stone 900
      bgPanel: 'bg-[#292524]/90 border-stone-600/50 shadow-xl backdrop-blur-sm', // Stone 800
      textMain: 'text-[#e7e5e4]', // Stone 200
      textSub: 'text-[#a8a29e]', // Stone 400
      textAccent: 'text-amber-500', // Gold/Amber accent
      border: 'border-stone-700',
      buttonPrimary: 'bg-amber-700 hover:bg-amber-600 text-stone-100 shadow-lg shadow-amber-900/20 border border-amber-600/50',
      buttonSecondary: 'text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg',
      font: 'font-fantasy', // Gowun Batang
      overlay: 'bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-stone-950/40 to-black/80'
    }
  },
  [THEME_KEYS.GOTHIC]: {
    name: '🧛 고딕 호러 (Gothic)',
    classes: {
      // 채도가 낮고 깊이감 있는 흑적색 (Rose/Slate)
      bgMain: 'bg-[#0a0a0a]',
      bgPanel: 'bg-[#111111]/95 border-rose-900/30 shadow-2xl shadow-black',
      textMain: 'text-slate-300',
      textSub: 'text-slate-500',
      textAccent: 'text-rose-700', // Deep blood red
      border: 'border-rose-950',
      buttonPrimary: 'bg-rose-950 hover:bg-rose-900 text-rose-100 border border-rose-900/50 shadow-[0_0_15px_rgba(159,18,57,0.2)]',
      buttonSecondary: 'text-slate-500 hover:text-rose-500 hover:bg-black',
      font: 'font-serif', // Noto Serif KR
      overlay: 'bg-[linear-gradient(to_bottom,rgba(20,0,0,0.1),rgba(0,0,0,0.8))]'
    }
  },
  [THEME_KEYS.CYBERPUNK]: {
    name: '🦾 사이버펑크 (Cyberpunk)',
    classes: {
      // 트루 블랙(True Black) + 고대비 네온 (High Contrast)
      // 모험 테마의 '회갈색'과 구별되도록 배경을 완전한 검정으로 처리
      bgMain: 'bg-black', 
      bgPanel: 'bg-zinc-900/80 border-cyan-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      textMain: 'text-white', // Pure white for high contrast
      textSub: 'text-zinc-500', // Neutral Gray
      textAccent: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
      border: 'border-cyan-900',
      buttonPrimary: 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      buttonSecondary: 'text-zinc-500 hover:text-pink-500 hover:bg-zinc-900 border border-transparent hover:border-pink-500/50',
      font: 'font-sans', // Clean Sans or Mono
      // Grid Pattern Overlay for Tech feel
      overlay: 'bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[length:30px_30px]'
    }
  },
  [THEME_KEYS.NOIR]: {
    name: '🕵️ 누아르 (Noir)',
    classes: {
      bgMain: 'bg-[#171717]',
      bgPanel: 'bg-[#262626] border-neutral-600 shadow-xl',
      textMain: 'text-[#d4d4d4]',
      textSub: 'text-[#737373]',
      textAccent: 'text-white underline decoration-1 underline-offset-4 decoration-neutral-500',
      border: 'border-neutral-700',
      buttonPrimary: 'bg-[#404040] hover:bg-[#525252] text-white border border-neutral-500',
      buttonSecondary: 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800',
      font: 'font-serif',
      overlay: 'bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px]'
    }
  },
  [THEME_KEYS.MILITARY]: {
    name: '🪖 밀리터리 (Military)',
    classes: {
      bgMain: 'bg-[#1a1c18]', // Deep Green-Black
      bgPanel: 'bg-[#252822]/95 border-[#4d5e46] shadow-lg',
      textMain: 'text-[#e2e8d8]',
      textSub: 'text-[#78826c]',
      textAccent: 'text-[#bef264]', // Bright Lime
      border: 'border-[#444f3a]',
      buttonPrimary: 'bg-[#3f4931] hover:bg-[#4d593b] text-[#e2e8d8] font-bold border border-[#78826c] tracking-wider',
      buttonSecondary: 'text-[#78826c] hover:text-[#bef264] hover:bg-[#2f332b]',
      font: 'font-mono',
      overlay: 'bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.2)_0px,rgba(0,0,0,0.2)_2px,transparent_2px,transparent_4px)]'
    }
  },
  [THEME_KEYS.SCIFI]: {
    name: '🚀 SF (Sci-Fi)',
    classes: {
      bgMain: 'bg-[#0b0c15]', // Deep Space
      bgPanel: 'bg-[#15162e]/70 backdrop-blur-xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      textMain: 'text-indigo-50',
      textSub: 'text-indigo-300/50',
      textAccent: 'text-violet-400 font-bold',
      border: 'border-indigo-500/20',
      buttonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]',
      buttonSecondary: 'text-indigo-400 hover:text-white hover:bg-indigo-900/30 rounded-full',
      font: 'font-sans',
      overlay: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent'
    }
  },
  [THEME_KEYS.MINIMAL]: {
    name: '⬜ 미니멀 (Minimal)',
    classes: {
      bgMain: 'bg-[#f4f4f5]', // Zinc 100
      bgPanel: 'bg-white border border-zinc-200 shadow-sm',
      textMain: 'text-zinc-900',
      textSub: 'text-zinc-400',
      textAccent: 'text-black font-black',
      border: 'border-zinc-200',
      buttonPrimary: 'bg-black hover:bg-zinc-800 text-white shadow-lg',
      buttonSecondary: 'text-zinc-400 hover:text-black hover:bg-zinc-100',
      font: 'font-sans',
      overlay: ''
    }
  }
};

// Use valid UUIDs for initial data
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: '워터딥: 드래곤 하이스트',
    subTitle: 'Waterdeep: Dragon Heist',
    system: SystemType.DND5E,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/10/200/200',
    theme: THEME_KEYS.ADVENTURE 
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: '판델버와 그 아래',
    subTitle: 'Phandelver and Below',
    system: SystemType.DND5E,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/11/200/200',
    theme: THEME_KEYS.ADVENTURE
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: '스트라드 폰 자로비치의 저주',
    subTitle: 'Curse of Strahd',
    system: SystemType.DND5E,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/12/200/200',
    theme: THEME_KEYS.GOTHIC
  },
  {
    id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    name: '사이버펑크 RED',
    subTitle: 'Cyberpunk RED',
    system: SystemType.CYBERPUNK_RED,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/13/200/200',
    theme: THEME_KEYS.CYBERPUNK
  }
];

export const INITIAL_STATE: AppState = {
  campaigns: INITIAL_CAMPAIGNS,
  characters: [],
  globalBackgrounds: [
    'https://picsum.photos/id/1002/1920/1080',
    'https://picsum.photos/id/1015/1920/1080',
    'https://picsum.photos/id/1033/1920/1080'
  ],
  password: '1234'
};