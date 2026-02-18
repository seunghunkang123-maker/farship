import { createClient } from '@supabase/supabase-js';

// Access environment variables safely using optional chaining
// We also provide hardcoded fallbacks based on your provided keys to ensure it works in environments where .env might not load immediately
const SUPABASE_URL = 'https://jpbuzolkbsospfffkxtl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3b3SX3p-EW3Wj_9beFjkrg_IXlNdTTi';

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = envUrl || SUPABASE_URL;
const supabaseAnonKey = envKey || SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Key. Please check your configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);