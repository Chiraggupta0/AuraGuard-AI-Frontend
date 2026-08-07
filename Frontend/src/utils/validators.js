export const isEmailLike = (value) => /\S+@\S+\.\S+/.test(value);

export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
