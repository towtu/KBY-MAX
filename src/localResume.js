export const RESUME_STORAGE_KEY = 'kby_max_resume_items';
const MAX_RESUME_ITEMS = 12;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const normalizeItem = (item) => {
  const id = Number(item?.id);
  const progress = Number(item?.progress);
  const updatedAt = Number(item?.updatedAt) || Date.now();
  const mediaType = ['movie', 'tv', 'anime'].includes(item?.mediaType) ? item.mediaType : 'movie';
  const title = typeof item?.title === 'string' ? item.title.trim() : '';

  if (!id || !title || !Number.isFinite(progress) || progress <= 0) {
    return null;
  }

  return {
    id,
    mediaType,
    title,
    posterPath: item?.posterPath || '',
    backdropPath: item?.backdropPath || '',
    progress,
    updatedAt
  };
};

export const getResumeItems = (storage = getStorage()) => {
  if (!storage) return [];

  try {
    const rawItems = JSON.parse(storage.getItem(RESUME_STORAGE_KEY) || '[]');
    if (!Array.isArray(rawItems)) return [];

    return rawItems
      .map(normalizeItem)
      .filter(Boolean)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_RESUME_ITEMS);
  } catch {
    return [];
  }
};

export const saveResumeItem = (item, storage = getStorage()) => {
  if (!storage) return [];

  const normalized = normalizeItem(item);
  const existingItems = getResumeItems(storage).filter((existing) => {
    const mediaType = ['movie', 'tv', 'anime'].includes(item?.mediaType) ? item.mediaType : 'movie';
    return existing.id !== Number(item?.id) || existing.mediaType !== mediaType;
  });
  const nextItems = normalized ? [normalized, ...existingItems].slice(0, MAX_RESUME_ITEMS) : existingItems;

  storage.setItem(RESUME_STORAGE_KEY, JSON.stringify(nextItems));
  return nextItems;
};

export const mapResumeItemsForCards = (items = []) => (
  items.map((item) => ({
    id: item.id,
    media_type: item.mediaType,
    mediaType: item.mediaType,
    title: item.title,
    name: item.title,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath
  }))
);
