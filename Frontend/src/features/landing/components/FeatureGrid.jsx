import { Card } from '@/components';

const features = [
  { title: 'Live detection', description: 'Detect unsafe behavior from video and event streams in real time.' },
  { title: 'Moderator actions', description: 'Escalate, warn, mute, or remove participants through a clear workflow.' },
  { title: 'Operational visibility', description: 'Track alerts, incidents, and trends in a structured dashboard.' },
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title}>
          <h3 className="text-lg font-semibold text-slate-100">{feature.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
        </Card>
      ))}
    </section>
  );
}
