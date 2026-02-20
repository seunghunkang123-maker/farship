
export const getOptimizedImageUrl = (url: string | undefined, width: number = 300) => {
  if (!url) return '';
  // Check if it's a Supabase Storage URL
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url.replace('/object/public/', '/render/image/public/') + `?width=${width}&quality=80`;
  }
  return url;
};
