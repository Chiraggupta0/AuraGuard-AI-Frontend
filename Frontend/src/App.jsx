import AppProviders from './AppProviders';
import AppRoutes from './routes';
import useAuthListener from './hooks/useAuthListener';

export default function App() {
  useAuthListener();

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
