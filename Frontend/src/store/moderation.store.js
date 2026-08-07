import { create } from 'zustand';

export const useModerationStore = create((set) => ({
  queue: [],
  selectedCaseId: null,
  setQueue: (queue) => set({ queue }),
  setSelectedCaseId: (selectedCaseId) => set({ selectedCaseId }),
  clearQueue: () => set({ queue: [], selectedCaseId: null }),
}));
