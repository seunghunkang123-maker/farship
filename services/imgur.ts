
import { fileToBase64 } from './storage';

// 환경 변수 접근 시 안전성 확보
const getImgurClientId = () => {
  try {
    return import.meta.env?.VITE_IMGUR_CLIENT_ID || '';
  } catch (e) {
    console.warn('Environment variable access failed', e);
    return '';
  }
};

const IMGUR_CLIENT_ID = getImgurClientId();

/**
 * 이미지를 Imgur에 업로드하고 URL을 반환합니다.
 * Client ID가 없거나 실패할 경우, 기존 방식대로 Base64 문자열을 반환합니다.
 */
export const uploadImage = async (file: File): Promise<string> => {
  // 1. 파일 크기 체크 (20MB 제한)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("이미지 파일 크기는 20MB 이하여야 합니다.");
  }

  // 2. Imgur Client ID가 없으면 바로 Base64로 변환 (기존 로직)
  if (!IMGUR_CLIENT_ID) {
    console.warn("Imgur Client ID not found. Falling back to Base64 storage.");
    return await fileToBase64(file);
  }

  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Imgur Upload Failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data.link; // Imgur URL 반환
    } else {
      throw new Error(data.data.error || "Imgur upload failed");
    }
  } catch (error) {
    console.error("Imgur upload error, falling back to base64:", error);
    // 실패 시 Base64로 폴백
    return await fileToBase64(file);
  }
};
