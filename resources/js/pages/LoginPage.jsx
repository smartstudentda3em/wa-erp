import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api, { initCsrf } from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const loadMe = useAuthStore((s) => s.loadMe);
  const [form, setForm] = useState({ phone: '', password: '', remember: true });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await initCsrf();
      await api.post('/login', form);
      await loadMe();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'تعذّر تسجيل الدخول. تحقّق من البيانات.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-bg p-4 relative overflow-hidden" dir="rtl">
      {/* خلفية زخرفية ناعمة */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-2/20 blur-3xl" />
      </div>

      <form onSubmit={submit} className="card shadow-pop p-8 w-full max-w-sm space-y-5 animate-scale-in">
        <div className="text-center">
          <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white text-2xl font-extrabold shadow-lg shadow-brand/30 mb-3">W</div>
          <div className="text-xl font-bold text-content">WhatsApp ERP</div>
          <p className="text-sm text-muted mt-1">سجّل الدخول للمتابعة</p>
        </div>

        {error && <div className="rounded-xl bg-rose-500/10 text-rose-500 text-sm px-3.5 py-2.5">{error}</div>}

        <div>
          <label className="label">رقم الهاتف</label>
          <input type="tel" inputMode="numeric" autoComplete="username" dir="ltr" required
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input text-start" />
        </div>

        <div>
          <label className="label">كلمة المرور</label>
          <input type="password" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input" />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted select-none">
          <input type="checkbox" checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
          تذكّرني
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'جارِ الدخول...' : <><LogIn size={17} /> دخول</>}
        </button>
      </form>
    </div>
  );
}
