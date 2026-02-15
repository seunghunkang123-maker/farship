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
      bgMain: 'bg-slate-900',
      bgPanel: 'bg-slate-800/90 border-slate-600',
      textMain: 'text-slate-100',
      textSub: 'text-slate-400',
      textAccent: 'text-blue-400',
      border: 'border-slate-600',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50',
      buttonSecondary: 'text-slate-400 hover:text-white hover:bg-slate-700',
      font: '', // Standard Sans
      overlay: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-900/50 to-slate-950/80'
    }
  },
  [THEME_KEYS.GOTHIC]: {
    name: '🧛 고딕 호러 (Gothic)',
    classes: {
      bgMain: 'bg-stone-950',
      bgPanel: 'bg-[#1c1917] border-red-900/40 shadow-xl shadow-black',
      textMain: 'text-stone-300',
      textSub: 'text-stone-600',
      textAccent: 'text-red-600',
      border: 'border-red-900/40',
      buttonPrimary: 'bg-red-900 hover:bg-red-800 text-stone-200 border border-red-700',
      buttonSecondary: 'text-stone-600 hover:text-red-500 hover:bg-stone-900',
      font: 'font-serif', // Nanum Myeongjo
      overlay: 'bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(50,0,0,0.1))]'
    }
  },
  [THEME_KEYS.CYBERPUNK]: {
    name: '🦾 사이버펑크 (Cyberpunk)',
    classes: {
      bgMain: 'bg-black',
      bgPanel: 'bg-zinc-900 border-l-4 border-l-yellow-400 border-r border-r-cyan-500 border-y border-zinc-700',
      textMain: 'text-cyan-400',
      textSub: 'text-pink-500',
      textAccent: 'text-yellow-400',
      border: 'border-cyan-500/50',
      buttonPrimary: 'bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest skew-x-[-10deg]',
      buttonSecondary: 'text-pink-500 hover:text-cyan-400 hover:bg-zinc-800 border border-transparent hover:border-cyan-500',
      font: 'font-mono', // Nanum Gothic Coding
      overlay: 'bg-[linear-gradient(90deg,rgba(0,0,0,0)_50%,rgba(0,255,255,0.05)_50%),linear-gradient(rgba(0,0,0,0)_50%,rgba(255,0,255,0.05)_50%)] bg-[length:4px_4px]'
    }
  },
  [THEME_KEYS.NOIR]: {
    name: '🕵️ 누아르 (Noir)',
    classes: {
      bgMain: 'bg-neutral-900 grayscale contrast-125',
      bgPanel: 'bg-neutral-800 border border-neutral-500 shadow-2xl',
      textMain: 'text-neutral-200',
      textSub: 'text-neutral-500',
      textAccent: 'text-white underline decoration-2 underline-offset-4',
      border: 'border-neutral-500',
      buttonPrimary: 'bg-neutral-200 hover:bg-white text-black font-bold border-2 border-black',
      buttonSecondary: 'text-neutral-400 hover:text-white hover:bg-neutral-700',
      font: 'font-serif', // Nanum Myeongjo
      overlay: 'bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px]'
    }
  },
  [THEME_KEYS.MILITARY]: {
    name: '🪖 밀리터리 (Military)',
    classes: {
      bgMain: 'bg-stone-900',
      bgPanel: 'bg-[#2a2b26] border-2 border-[#4b5320]',
      textMain: 'text-emerald-100',
      textSub: 'text-[#8f9e78]',
      textAccent: 'text-[#d4af37]',
      border: 'border-[#4b5320]',
      buttonPrimary: 'bg-[#4b5320] hover:bg-[#5b6330] text-white font-bold uppercase rounded-none border border-[#6b7340]',
      buttonSecondary: 'text-[#8f9e78] hover:text-[#d4af37] hover:bg-[#3a3b36]',
      font: '', // Standard, headers can be styled individually
      overlay: 'bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_10px,transparent_10px,transparent_20px)]'
    }
  },
  [THEME_KEYS.SCIFI]: {
    name: '🚀 SF (Sci-Fi)',
    classes: {
      bgMain: 'bg-slate-950',
      bgPanel: 'bg-slate-900/60 backdrop-blur-md border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      textMain: 'text-blue-50',
      textSub: 'text-blue-300/70',
      textAccent: 'text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]',
      border: 'border-blue-400/30',
      buttonPrimary: 'bg-blue-600/80 hover:bg-blue-500 text-white rounded-full px-6 shadow-[0_0_10px_rgba(37,99,235,0.5)]',
      buttonSecondary: 'text-blue-400 hover:text-white hover:bg-blue-900/30 rounded-full',
      font: 'font-bold-display', // Do Hyeon or just Standard
      overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/60 to-black'
    }
  },
  [THEME_KEYS.MINIMAL]: {
    name: '⬜ 미니멀 (Minimal)',
    classes: {
      bgMain: 'bg-white',
      bgPanel: 'bg-white border border-gray-200 shadow-sm',
      textMain: 'text-gray-900',
      textSub: 'text-gray-400',
      textAccent: 'text-black font-bold',
      border: 'border-gray-200',
      buttonPrimary: 'bg-black hover:bg-gray-800 text-white rounded-md',
      buttonSecondary: 'text-gray-400 hover:text-black hover:bg-gray-100',
      font: '',
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