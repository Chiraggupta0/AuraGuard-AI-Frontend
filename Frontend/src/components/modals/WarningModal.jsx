import Button from '@/components/ui/Button';
import ReusableModalShell from './ReusableModalShell';

export default function WarningModal({ title = 'Warning', message, onClose }) {
  return (
    <ReusableModalShell
      title={title}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {message}
    </ReusableModalShell>
  );
}
