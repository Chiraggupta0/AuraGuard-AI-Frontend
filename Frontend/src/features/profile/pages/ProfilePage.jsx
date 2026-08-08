import { motion } from 'framer-motion';
import { EmptyState, PageHeader, ProfileCard } from '@/components';
import useAuth from '@/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          eyebrow="Account"
          title="Profile"
          description="View and manage your account information and preferences."
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {user ? (
          <ProfileCard user={user} />
        ) : (
          <EmptyState title="Not signed in" description="Sign in to view your profile details and account information." />
        )}
      </motion.div>
    </motion.div>
  );
}
