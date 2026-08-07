export default function ParticipantTile({ name, status = 'connected' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-medium text-slate-100">{name}</p>
      <p className="text-sm text-slate-400">{status}</p>
    </div>
  );
}
