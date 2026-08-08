export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const formatDate = (value) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));

export const formatCount = (value) => new Intl.NumberFormat('en').format(value ?? 0);

export const getDisplayName = (user) => user?.displayName || user?.email?.split('@')[0] || 'User';

export const getInitials = (name) => {
  const source = name?.trim();
  if (!source) return 'U';

  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const getLoginMethod = (user) => {
  const providerId = user?.providerData?.[0]?.providerId;
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'password') return 'Email & Password';
  return 'Unknown';
};
