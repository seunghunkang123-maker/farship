
import { createClient } from '@supabase/supabase-js';

// 사용자가 제공한 Supabase 접속 정보
const SUPABASE_URL = 'https://vevygpebqdrbbuwaocxx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UgfBCxV2hKn9AtIJSWvRWw_jrGxhWYq';

// 환경 변수가 있으면 그것을 우선 사용하고, 없으면 위 하드코딩된 값을 사용 (Vercel 배포 문제 해결)
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = envUrl || SUPABASE_URL;
const supabaseAnonKey = envKey || SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Key is missing!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
