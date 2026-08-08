export const getErrorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.message ?? error?.message ?? fallback;

const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account already exists with this email.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

export const getFirebaseErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  FIREBASE_ERROR_MESSAGES[error?.code] ?? error?.message ?? fallback;
