import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  MessageCircle, Megaphone, FileText, FlaskConical, Users, Settings2,
  PanelRightClose, PanelRightOpen, Search, Bell, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useCan } from '../hooks/useCan';
import { useTemplateToasts } from '../hooks/useTemplateToasts';
import ToastContainer from '../components/ui/ToastContainer';
import ThemeToggle from '../components/ui/ThemeToggle';
import AvailabilityMenu from '../components/ui/AvailabilityMenu';
import Avatar from '../components/ui/Avatar';
import api from '../lib/axios';

const ROLE_LABEL = { admin: 'مدير النظام', manager: 'مشرف', agent: 'مبيعات' };

// التخطيط الرئيسي: قائمة جانبية قابلة للطي + شريط علوي + محتوى الصفحة
export default function AppLayout() {
  const { user, loaded, loadMe, reset } = useAuthStore();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('wa-sidebar') === '1');

  useEffect(() => { useThemeStore.getState().init(); }, []);
  useEffect(() => { if (!loaded) loadMe(); }, [loaded]);

  if (!loaded) {
    return <div className="h-screen grid place-items-center bg-bg text-muted">جارِ التحميل...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const toggle = () => setCollapsed((c) => {
    const n = !c; localStorage.setItem('wa-sidebar', n ? '1' : '0'); return n;
  });

  const logout = async () => {
    try { await api.post('/logout'); } catch { /* تجاهل */ }
    reset();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-bg text-content" dir="rtl">
      <TemplateToasts />
      <ToastContainer />
      <Sidebar user={user} collapsed={collapsed} onToggle={toggle} onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TemplateToasts() { useTemplateToasts(); return null; }

/* ============================ الشريط الجانبي ============================ */
function Sidebar({ user, collapsed, onToggle, onLogout }) {
  const can = useCan();

  const items = [
    { to: '/', label: 'المحادثات', icon: MessageCircle, tint: 'bg-emerald-500/10 text-emerald-500', show: true, end: true },
    { to: '/campaigns', label: 'الحملات', icon: Megaphone, tint: 'bg-sky-500/10 text-sky-500', show: true },
    { to: '/templates', label: 'القوالب', icon: FileText, tint: 'bg-violet-500/10 text-violet-500', show: true },
    { to: '/test-log', label: 'سجل الاختبارات', icon: FlaskConical, tint: 'bg-amber-500/10 text-amber-500', show: can('campaigns.manage') },
    { to: '/settings/team', label: 'إدارة الفريق', icon: Users, tint: 'bg-rose-500/10 text-rose-500', show: can('accounts.manage') },
    { to: '/settings/accounts', label: 'إعدادات الحسابات', icon: Settings2, tint: 'bg-slate-500/10 text-slate-500', show: can('accounts.manage') },
  ].filter((i) => i.show);

  return (
    <aside className={`${collapsed ? 'w-[76px]' : 'w-64'} shrink-0 bg-surface border-l border-line flex flex-col transition-all duration-300`}>
      {/* الشعار + زر الطي */}
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-line">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white font-extrabold shadow-lg shadow-brand/25 shrink-0">W</div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-bold text-content leading-tight truncate">WhatsApp ERP</div>
            <div className="text-[11px] text-muted">مركز التحكّم</div>
          </div>
        )}
        <button onClick={onToggle} className="btn-icon" title={collapsed ? 'توسيع' : 'طيّ'}>
          {collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
        </button>
      </div>

      {/* التنقّل */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {items.map((i) => {
          const Icon = i.icon;
          return (
            <NavLink key={i.to} to={i.to} end={i.end} title={collapsed ? i.label : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-brand to-brand-2" />}
                  <span className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${i.tint}`}><Icon size={17} /></span>
                  {!collapsed && <span className="flex-1 truncate">{i.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* الملف الشخصي */}
      <div className="p-3 border-t border-line">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? 'justify-center' : 'bg-surface-2'}`}>
          <Avatar name={user.name} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-content truncate">{user.name}</div>
              <div className="text-[11px] text-muted truncate">{ROLE_LABEL[user.roles?.[0]] ?? user.roles?.[0] ?? ''}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} className="btn-icon" title="تسجيل الخروج"><LogOut size={17} /></button>
          )}
        </div>
        {collapsed && (
          <button onClick={onLogout} className="btn-icon w-full mt-1 grid place-items-center" title="تسجيل الخروج"><LogOut size={17} /></button>
        )}
      </div>
    </aside>
  );
}

/* ============================ الشريط العلوي ============================ */
function Topbar() {
  return (
    <header className="h-16 shrink-0 bg-surface/80 backdrop-blur-xl border-b border-line flex items-center gap-3 px-5">
      {/* بحث شامل */}
      <div className="relative flex-1 max-w-md">
        <Search size={17} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted pointer-events-none" />
        <input
          className="w-full rounded-xl border border-line bg-surface-2/60 ps-9 pe-3 py-2 text-sm text-content placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:bg-surface transition"
          placeholder="بحث في المحادثات والعملاء..."
        />
      </div>

      <div className="flex-1" />

      {/* أدوات */}
      <div className="flex items-center gap-2">
        <button className="btn-icon relative" title="الإشعارات">
          <Bell size={18} />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-surface" />
        </button>
        <ThemeToggle />
        <div className="w-px h-6 bg-line mx-1" />
        <AvailabilityMenu />
      </div>
    </header>
  );
}
