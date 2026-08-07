import { useAIDetectionStore } from '@/store/aiDetection.store';

export default function useAIAlerts() {
  return useAIDetectionStore((state) => ({
    alerts: state.alerts,
    riskLevel: state.riskLevel,
    isLiveMonitoring: state.isLiveMonitoring,
    pushAlert: state.pushAlert,
    setRiskLevel: state.setRiskLevel,
    setLiveMonitoring: state.setLiveMonitoring,
    clearAlerts: state.clearAlerts,
  }));
}
