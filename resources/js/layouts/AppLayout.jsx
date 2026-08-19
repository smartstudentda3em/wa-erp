import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCan } from '../hooks/useCan';
import { useTemplateToasts } from '../hooks/useTemplateToasts';
import ToastContainer from '../components/ui/ToastContainer';
import api from '../lib/axios';

// التخطيط الرئيسي: قائمة تنقّل جانبية + محتوى الصفحة (Outlet)
export default function AppLayout() {
  const { user, loaded, loadMe, reset } = useAuthStore();

  useEffect(() => {
    if (!loaded) loadMe();
  }, [loaded]);

  if (!loaded) {
    return <div className="h-screen flex items-center justify-center text-gray-400">جارِ التحميل...</div>;
  }
  // غير مسجّل → تحويل لصفحة الدخول
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const logout = async () => {
    await api.post('/logout');
    reset();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen" dir="rtl">
      <TemplateToasts />
      <ToastContainer />
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 overflow-hidden bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
}

// مكوّن صغير يُركّب المستمع العام فقط بعد المصادقة (احترام قواعد الـ hooks)
function TemplateToasts() {
  useTemplateToasts();
  return null;
}

// وسوم حالة التواجد
const AVAIL = {
  available: { label: 'متاح', dot: 'bg-green-500' },
  away: { label: 'بالخارج', dot: 'bg-amber-500' },
  offline: { label: 'غير متصل', dot: 'bg-gray-400' },
};

// مبدّل حالة التواجد للموظف الحالي — يؤثّر على استقبال الرسائل الجديدة (round-robin)
function AvailabilityToggle() {
  const availability = useAuthStore((s) => s.user?.availability) ?? 'available';
  const setAvailability = useAuthStore((s) => s.setAvailability);
  const [saving, setSaving] = useState(false);
  const av = AVAIL[availability] ?? AVAIL.offline;

  const change = async (e) => {
    setSaving(true);
    try { await setAvailability(e.target.value); } catch { /* تجاهل */ } finally { setSaving(false); }
  };

  return (
    <div className="mt-3 flex items-center gap-2" title="حالتك تؤثّر على استقبال الرسائل الجديدة">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${av.dot}`} />
      <select
        value={availability}
        onChange={change}
        disabled={saving}
        className="text-xs border rounded-lg px-2 py-1 bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
      >
        <option value="available">متاح</option>
        <option value="away">بالخارج</option>
        <option value="offline">غير متصل</option>
      </select>
    </div>
  );
}

function Sidebar({ user, onLogout }) {
  const can = useCan();

  // عناصر القائمة مع شرط الظهور
  const items = [
    { to: '/', label: 'المحادثات', icon: '💬', show: true, end: true },
    { to: '/campaigns', label: 'الحملات', icon: '📢', show: true },
    { to: '/templates', label: 'القوالب', icon: '📄', show: true },
    { to: '/test-log', label: 'سجل الاختبارات', icon: '🧪', show: can('campaigns.manage') },
    { to: '/settings/team', label: 'إدارة الفريق', icon: '👥', show: can('accounts.manage') },
    { to: '/settings/accounts', label: 'إعدادات الحسابات', icon: '⚙️', show: can('accounts.manage') },
  ];

  return (
    <aside className="w-60 bg-white border-l flex flex-col shrink-0">
      <div className="p-4 border-b">
        <div className="font-bold text-green-700">WhatsApp ERP</div>
        <div className="text-xs text-gray-400 mt-1">{user.name}</div>
        {user.roles?.length > 0 && (
          <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 mt-1 inline-block">
            {user.roles[0]}
          </span>
        )}
        <AvailabilityToggle />
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {items.filter((i) => i.show).map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
               ${isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <span>{i.icon}</span>
            <span>{i.label}</span>
          </NavLink>
        ))}
      </nav>

      <button onClick={onLogout} className="m-2 text-sm text-gray-500 border rounded-lg px-3 py-2 hover:bg-gray-50">
        تسجيل الخروج
      </button>
    </aside>
  );
}
