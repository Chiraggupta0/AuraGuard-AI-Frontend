import { useMeetingStore } from '@/store/meeting.store';

export default function useMeetingSession() {
  return useMeetingStore((state) => ({
    activeMeetingId: state.activeMeetingId,
    participants: state.participants,
    activeStreamId: state.activeStreamId,
    setActiveMeetingId: state.setActiveMeetingId,
    setParticipants: state.setParticipants,
    setActiveStreamId: state.setActiveStreamId,
    clearMeetingState: state.clearMeetingState,
  }));
}
