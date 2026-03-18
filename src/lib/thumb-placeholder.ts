// Picsum placeholders for video thumbs (seeded by title for consistency)
export const getThumbUrl = (title: string): string => {
  const seed = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://picsum.photos/seed=${seed}/480/270.jpg`;
};

