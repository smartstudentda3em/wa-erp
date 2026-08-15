import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    setError(null);
    setLoading(true);
    try {
      await initCsrf();               // 1) كوكي CSRF
      await api.post('/login', form); // 2) تسجيل الدخول (جلسة)
      await loadMe();                 // 3) تحميل الأدوار والصلاحيات
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'تعذّر تسجيل الدخول. تحقّق من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">WhatsApp ERP</div>
          <p className="text-sm text-gray-400 mt-1">تسجيل الدخول</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="username"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">كلمة المرور</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
          />
          تذكّرني
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white rounded-lg py-2 hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'جارِ الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
