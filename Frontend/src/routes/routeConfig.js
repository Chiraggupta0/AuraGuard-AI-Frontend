import ROUTES from '@/constants/routes.constants';

const routeConfig = {
  public: [ROUTES.landing, ROUTES.login, ROUTES.register, ROUTES.forgotPassword, ROUTES.resetPassword],
  protected: [ROUTES.dashboard, ROUTES.meetings, ROUTES.aiMonitoring, ROUTES.moderation, ROUTES.reports, ROUTES.notifications, ROUTES.profile, ROUTES.settings],
};

export default routeConfig;
