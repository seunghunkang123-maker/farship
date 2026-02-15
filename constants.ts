import { Campaign, SystemType, AppState } from './types';

// Use valid UUIDs for initial data to prevent database type errors
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: '워터딥: 드래곤 하이스트',
    subTitle: 'Waterdeep: Dragon Heist',
    system: SystemType.DND5E,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/10/200/200', 
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: '판델버와 그 아래',
    subTitle: 'Phandelver and Below',
    system: SystemType.DND5E,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/11/200/200',
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: '스트라드 폰 자로비치의 저주',
    subTitle: 'Curse of Strahd',
    system: SystemType.DND5E,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/12/200/200',
  },
  {
    id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    name: '사이버펑크 RED',
    subTitle: 'Cyberpunk RED',
    system: SystemType.CYBERPUNK_RED,
    backgroundImages: [],
    logoUrl: 'https://picsum.photos/id/13/200/200',
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
  password: '1234' // Default simple password
};