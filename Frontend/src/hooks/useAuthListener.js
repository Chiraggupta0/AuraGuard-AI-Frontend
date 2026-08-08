import { useEffect } from 'react';
import { subscribeToAuthChanges } from '@/features/authentication/services/firebaseAuth.service';
import { useAuthStore } from '@/store/auth.store';

export default function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(setUser);
    return unsubscribe;
  }, [setUser]);
}
