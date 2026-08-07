export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const formatCount = (value) => new Intl.NumberFormat('en').format(value ?? 0);
