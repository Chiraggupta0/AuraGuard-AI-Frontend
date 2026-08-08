import { useShallow } from 'zustand/react/shallow';
import { useAIDetectionStore } from '@/store/aiDetection.store';

export default function useAIAlerts() {
  return useAIDetectionStore(
    useShallow((state) => ({
      alerts: state.alerts,
      riskLevel: state.riskLevel,
      isLiveMonitoring: state.isLiveMonitoring,
      pushAlert: state.pushAlert,
      setRiskLevel: state.setRiskLevel,
      setLiveMonitoring: state.setLiveMonitoring,
      clearAlerts: state.clearAlerts,
    })),
  );
}
