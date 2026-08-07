import Button from '@/components/ui/Button';
import ReusableModalShell from './ReusableModalShell';

export default function ConfirmModal({ title = 'Confirm action', message, onConfirm, onCancel }) {
  return (
    <ReusableModalShell
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </>
      }
    >
      {message}
    </ReusableModalShell>
  );
}
