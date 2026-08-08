import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = async (name, email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }

  return credential;
};

export const signOutUser = () => signOut(auth);

export const getCurrentUser = () => auth.currentUser;

export const subscribeToAuthChanges = (callback) => onAuthStateChanged(auth, callback);
