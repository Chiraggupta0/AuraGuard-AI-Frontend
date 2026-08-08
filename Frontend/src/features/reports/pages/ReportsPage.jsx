import { motion } from 'framer-motion';
import { PageHeader, SessionTable } from '@/components';
import { mockSessions } from '@/utils/mockData';

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

export default function ReportsPage() {
  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          eyebrow="Session History"
          title="Reports"
          description="Review previous meeting sessions, detailed metrics, and session reports."
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SessionTable sessions={mockSessions} />
      </motion.div>
    </motion.div>
  );
}
