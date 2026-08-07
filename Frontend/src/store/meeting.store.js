import { create } from 'zustand';

export const useMeetingStore = create((set) => ({
  activeMeetingId: null,
  participants: [],
  activeStreamId: null,
  setActiveMeetingId: (meetingId) => set({ activeMeetingId: meetingId }),
  setParticipants: (participants) => set({ participants }),
  setActiveStreamId: (streamId) => set({ activeStreamId: streamId }),
  clearMeetingState: () => set({ activeMeetingId: null, participants: [], activeStreamId: null }),
}));
