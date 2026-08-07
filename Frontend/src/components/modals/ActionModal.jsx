import Button from '@/components/ui/Button';
import ReusableModalShell from './ReusableModalShell';

export default function ActionModal({ title, message, actionLabel = 'Proceed', onAction, onCancel }) {
  return (
    <ReusableModalShell
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onAction}>{actionLabel}</Button>
        </>
      }
    >
      {message}
    </ReusableModalShell>
  );
}
