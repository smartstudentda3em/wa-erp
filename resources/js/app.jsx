import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import InboxPage from './pages/InboxPage';
import CampaignsPage from './pages/CampaignsPage';
import TemplatesPage from './pages/TemplatesPage';
import TestLogPage from './pages/TestLogPage';
import SettingsAccountsPage from './pages/SettingsAccountsPage';
import SettingsTeamPage from './pages/SettingsTeamPage';
import { useThemeStore } from './stores/themeStore';
import '../css/app.css';

// تطبيق الثيم قبل أول رسم لتفادي الوميض
useThemeStore.getState().init();

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <InboxPage /> },
      { path: '/campaigns', element: <CampaignsPage /> },
      { path: '/templates', element: <TemplatesPage /> },
      { path: '/test-log', element: <TestLogPage /> },
      { path: '/settings/team', element: <SettingsTeamPage /> },
      { path: '/settings/accounts', element: <SettingsAccountsPage /> },
    ],
  },
]);

createRoot(document.getElementById('app')).render(<RouterProvider router={router} />);
