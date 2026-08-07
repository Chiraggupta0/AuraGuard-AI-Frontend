import { Link } from 'react-router-dom';
import { Button, Card } from '@/components';
import ROUTES from '@/constants/routes.constants';
import { FeatureGrid } from '../components/FeatureGrid';
import HeroSection from '../components/HeroSection';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <HeroSection />
      <FeatureGrid />
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Built for moderators, operators, and safety teams</h2>
          <p className="mt-2 text-sm text-slate-300">AuraGuard AI keeps live meetings safer without disrupting the experience.</p>
        </div>
        <Link to={ROUTES.login}>
          <Button>Enter Dashboard</Button>
        </Link>
      </Card>
    </main>
  );
}
