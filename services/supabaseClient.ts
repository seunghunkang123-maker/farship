
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// [긴급 수정] 배포 환경 연결 문제 해결
// 환경 변수 충돌을 방지하기 위해 올바른 접속 정보를 직접 지정합니다.
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://vevygpebqdrbbuwaocxx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UgfBCxV2hKn9AtIJSWvRWw_jrGxhWYq';

// 디버깅을 위한 콘솔 로그 (브라우저 개발자 도구에서 확인 가능)
console.log('✅ Force connecting to Supabase:', SUPABASE_URL);

// 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // 세션 유지
    autoRefreshToken: true, // 토큰 자동 갱신
  },
});
