import { Badge, Button, Card } from '@/components';
import EmptyState from './EmptyState';

const toneMap = {
  Completed: 'success',
  Flagged: 'warning',
  Reviewed: 'info',
};

export default function SessionTable({ sessions }) {
  if (!sessions.length) {
    return <EmptyState title="No sessions yet" description="Previous meeting sessions will appear here once they are available." />;
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Session Name</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Date</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Duration</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sessions.map((session) => (
              <tr key={session.id} className="transition-colors hover:bg-slate-900/30">
                <td className="px-6 py-4 font-medium text-slate-100">{session.sessionName}</td>
                <td className="px-6 py-4 text-slate-400">{session.date}</td>
                <td className="px-6 py-4 text-slate-400">{session.duration}</td>
                <td className="px-6 py-4">
                  <Badge tone={toneMap[session.status] ?? 'neutral'}>{session.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Button variant="secondary" size="sm">
                    View Report
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
