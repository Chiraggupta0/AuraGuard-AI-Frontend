import Badge from '@/components/ui/Badge';
import useAIAlerts from '@/hooks/useAIAlerts';

export default function LiveRiskBadge() {
  const { riskLevel } = useAIAlerts();

  return <Badge tone={riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'info'}>Risk: {riskLevel}</Badge>;
}
