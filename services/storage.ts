import { AppState } from '../types';
import { INITIAL_STATE } from '../constants';

const STORAGE_KEY = 'trpg-char-db-v1';

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(serializedState);
    // Merge with initial campaigns if they are missing (simple migration logic)
    if (!parsed.campaigns || parsed.campaigns.length === 0) {
      parsed.campaigns = INITIAL_STATE.campaigns;
    }
    return parsed;
  } catch (err) {
    console.error("Failed to load state", err);
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Failed to save state", err);
    alert("저장 공간이 부족하여 저장에 실패했습니다. 이미지를 줄여주세요.");
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};