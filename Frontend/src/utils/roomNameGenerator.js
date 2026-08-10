export const generateRoomName = () => {
  const adjectives = ['Aurora', 'Quantum', 'Nexus', 'Prism', 'Apex', 'Zenith'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNum = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${randomAdj}-${randomNum}`;
};

export const isValidRoomName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 128) return false;
  return /^[a-zA-Z0-9-]+$/.test(name);
};
