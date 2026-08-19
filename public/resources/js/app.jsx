import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import InboxPage from './pages/InboxPage';
import CampaignsPage from './pages/CampaignsPage';
import TemplatesPage from './pages/TemplatesPage';
import TestLogPage from './pages/TestLogPage';
import SettingsAccountsPage from './pages/SettingsAccountsPage';
import '../css/app.css';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <InboxPage /> },
      { path: '/campaigns', element: <CampaignsPage /> },
      { path: '/templates', element: <TemplatesPage /> },
      { path: '/test-log', element: <TestLogPage /> },
      { path: '/settings/accounts', element: <SettingsAccountsPage /> },
    ],
  },
]);

createRoot(document.getElementById('app')).render(<RouterProvider router={router} />);
