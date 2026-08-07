export const getItem = (key, fallback = null) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export const setItem = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeItem = (key) => {
  window.localStorage.removeItem(key);
};
