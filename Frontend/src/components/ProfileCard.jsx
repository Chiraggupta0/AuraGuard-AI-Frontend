import { getDisplayName, getInitials, getLoginMethod, formatDate } from '@/utils/formatters';
import Card from './ui/Card';

export default function ProfileCard({ user }) {
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const fields = [
    { label: 'Email', value: user?.email ?? '—' },
    { label: 'Login Method', value: getLoginMethod(user) },
    { label: 'Member Since', value: user?.metadata?.creationTime ? formatDate(user.metadata.creationTime) : '—' },
  ];

  return (
    <Card className="space-y-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="h-24 w-24 rounded-lg object-cover ring-4 ring-auraguard-500/20"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-lg bg-gradient-to-br from-auraguard-400 to-auraguard-600 text-3xl font-bold text-white">
            {initials}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>
          <p className="text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{field.label}</dt>
            <dd className="text-sm font-medium text-slate-900">{field.value}</dd>
          </div>
        ))}
      </div>
    </Card>
  );
}
