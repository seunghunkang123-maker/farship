
import { supabase } from './supabaseClient';

const BUCKET_NAME = 'images';

/**
 * 파일을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 */
export const uploadImage = async (file: File): Promise<string> => {
  // 1. 파일 크기 체크 (20MB 제한)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("이미지 파일 크기는 20MB 이하여야 합니다.");
  }

  try {
    // 2. 파일명 생성 (충돌 방지를 위해 타임스탬프 + 난수 조합)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // 3. Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // 버킷이 없을 경우에 대한 힌트 제공
      if (uploadError.message.includes('bucket not found')) {
        throw new Error("스토리지 버킷이 없습니다. DB 설정 메뉴에서 '스토리지 설정' SQL을 실행해주세요.");
      }
      throw uploadError;
    }

    // 4. 공개 URL 가져오기
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error: any) {
    console.error("Upload failed:", error);
    throw new Error(`이미지 업로드 실패: ${error.message || '알 수 없는 오류'}`);
  }
};
