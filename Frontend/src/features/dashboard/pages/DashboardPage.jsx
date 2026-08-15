import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, PageHeader, StatCard } from '@/components';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';
import { getDisplayName } from '@/utils/formatters';
import { mockRecentActivity } from '@/utils/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = getDisplayName(user).split(' ')[0];

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          eyebrow="Workspace Overview"
          title={`Welcome back, ${firstName}`}
          description="Start a new moderated meeting, review sessions, or manage your workspace from one unified dashboard."
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid gap-4 lg:grid-cols-2">
          <StatCard
            title="Create Room"
            description="Start a new moderated meeting room and prepare a live session in seconds with full safety features."
            actionLabel="Create Room"
            to={ROUTES.createRoom}
          />
          <StatCard
            title="Join Room"
            description="Enter an existing meeting room using a simple invite code or direct link."
            actionLabel="Join Room"
            to={ROUTES.joinRoom}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>
              <p className="mt-1 text-slate-500">Your latest meeting sessions and moderation events.</p>
            </div>
            <Button as={Link} to={ROUTES.reports} variant="secondary">
              View All Reports
            </Button>
          </div>

          {mockRecentActivity.length ? (
            <div className="space-y-3 border-t border-slate-200 pt-6">
              {mockRecentActivity.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 hover:bg-white transition-all duration-200"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.detail}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent activity" description="Recent actions will appear here once meetings start flowing through the dashboard." />
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
