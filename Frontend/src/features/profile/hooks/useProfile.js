import { useUserStore } from '@/store/user.store';

export default function useProfile() {
  return useUserStore((state) => ({
    profile: state.profile,
    setProfile: state.setProfile,
    clearProfile: state.clearProfile,
  }));
}
