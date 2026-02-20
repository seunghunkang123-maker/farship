
export const getOptimizedImageUrl = (url: string | undefined, width: number = 600) => {
  if (!url) return '';
  // Check if it's a Supabase Storage URL
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const separator = url.includes('?') ? '&' : '?';
    return url.replace('/object/public/', '/render/image/public/') + `${separator}width=${width}&quality=85&resize=contain`;
  }
  return url;
};
