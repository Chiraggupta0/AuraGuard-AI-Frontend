export const toDate = (value) => new Date(value);

export const isSameDay = (left, right) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return leftDate.toDateString() === rightDate.toDateString();
};
