import { create } from 'zustand';

export const useAIDetectionStore = create((set) => ({
  alerts: [],
  riskLevel: 'low',
  isLiveMonitoring: false,
  setRiskLevel: (riskLevel) => set({ riskLevel }),
  setLiveMonitoring: (isLiveMonitoring) => set({ isLiveMonitoring }),
  pushAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 100) })),
  clearAlerts: () => set({ alerts: [] }),
}));
