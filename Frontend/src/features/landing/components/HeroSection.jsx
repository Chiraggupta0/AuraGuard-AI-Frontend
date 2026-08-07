import { motion } from 'framer-motion';
import { Button, Card } from '@/components';
import { pageAnimation } from '@/utils/animations';

export default function HeroSection() {
  return (
    <motion.section {...pageAnimation} className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
      <div className="space-y-5">
        <p className="text-xs uppercase tracking-[0.35em] text-auraguard-300">Realtime safety intelligence</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Detect unsafe behavior in live video meetings before it escalates.
        </h1>
        <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
          AuraGuard AI combines live monitoring, moderator workflows, and real-time alerts for enterprise video platforms.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>Get Started</Button>
          <Button variant="secondary">View Demo</Button>
        </div>
      </div>
      <Card>
        <p className="text-sm text-slate-400">Live risk snapshot</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-red-500/10 p-4 text-red-200">Policy violation detected in meeting stream</div>
          <div className="rounded-xl bg-auraguard-500/10 p-4 text-auraguard-100">Moderator notified and escalation queued</div>
        </div>
      </Card>
    </motion.section>
  );
}
