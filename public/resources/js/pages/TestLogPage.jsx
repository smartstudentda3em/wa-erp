import { useEffect, useState } from 'react';
import { useTestLogStore } from '../stores/testLogStore';
import { useToastStore } from '../stores/toastStore';
import { useCan } from '../hooks/useCan';

export default function TestLogPage() {
  const can = useCan();
  const {
    logs, pagination, filterOptions, filters, loading, stats,
    load, setFilter, resend, loadStats, exportExcel,
  } = useTestLogStore();
  const pushToast = useToastStore((s) => s.push);
  const [resendingId, setResendingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { load(1); loadStats(); }, []);

  const onExport = async () => {
    setExporting(true);
    try {
      await exportExcel();
    } catch {
      pushToast({ type: 'error', message: 'تعذّر التصدير.' });
    } finally {
      setExporting(false);
    }
  };

  if (!can('campaigns.manage')) {
    return <div className="p-6 text-center text-gray-400">لا تملك صلاحية عرض سجل الاختبارات.</div>;
  }

  const onResend = async (id) => {
    setResendingId(id);
    try {
      const msg = await resend(id);
      pushToast({ type: 'success', message: msg ?? 'تمت إعادة الإرسال.' });
    } catch (e) {
      pushToast({ type: 'error', message: e.response?.data?.message ?? 'فشلت إعادة الإرسال.' });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">سجل رسائل الاختبار</h1>
        <button
          onClick={onExport}
          disabled={exporting}
          className="bg-green-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {exporting ? 'جارِ التصدير...' : '⬇️ تصدير Excel'}
        </button>
      </div>

      {/* كروت الإحصائيات */}
      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard label="إجمالي الرسائل" value={stats.overall.total} cls="text-gray-800" />
            <StatCard label="ناجحة" value={stats.overall.sent} cls="text-green-600" />
            <StatCard label="فاشلة" value={stats.overall.failed} cls="text-red-500" />
            <StatCard label="نسبة النجاح" value={`${stats.overall.success_rate}%`} cls="text-sky-600" />
          </div>

          {stats.by_template.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 mb-2">حسب القالب</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.by_template.map((t, i) => (
                  <TemplateStatCard key={i} data={t} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          label="الحالة" value={filters.status}
          onChange={(v) => setFilter('status', v)}
          options={[{ value: 'sent', label: 'ناجحة' }, { value: 'failed', label: 'فاشلة' }]}
        />
        <Select
          label="المُرسِل" value={filters.user_id}
          onChange={(v) => setFilter('user_id', v)}
          options={filterOptions.users.map((u) => ({ value: u.id, label: u.name }))}
        />
        <Select
          label="القالب" value={filters.template_id}
          onChange={(v) => setFilter('template_id', v)}
          options={filterOptions.templates.map((t) => ({ value: t.id, label: t.name }))}
        />
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-right p-3">الحالة</th>
              <th className="text-right p-3">الرقم</th>
              <th className="text-right p-3">القالب</th>
              <th className="text-right p-3">المُرسِل</th>
              <th className="text-right p-3">الوقت</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">جارِ التحميل...</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">لا سجلّات مطابقة.</td></tr>
            )}
            {logs.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-3">
                  {t.status === 'sent'
                    ? <span className="text-green-600 text-xs">✓ ناجحة</span>
                    : <span className="text-red-500 text-xs" title={t.error}>✗ فاشلة</span>}
                </td>
                <td className="p-3 font-mono text-xs">{t.to}</td>
                <td className="p-3 text-gray-600">{t.template ?? '—'}</td>
                <td className="p-3 text-gray-600">{t.user ?? '—'}</td>
                <td className="p-3 text-gray-400 text-xs">
                  {new Date(t.created_at).toLocaleString('ar', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onResend(t.id)}
                    disabled={resendingId === t.id}
                    className="text-xs text-sky-600 hover:underline disabled:opacity-50"
                  >
                    {resendingId === t.id ? '...' : '↻ إعادة إرسال'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ترقيم */}
      {pagination && pagination.last > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button
            disabled={pagination.current <= 1}
            onClick={() => load(pagination.current - 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >السابق</button>
          <span className="text-gray-500">{pagination.current} / {pagination.last}</span>
          <button
            disabled={pagination.current >= pagination.last}
            onClick={() => load(pagination.current + 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >التالي</button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, cls }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 text-center">
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// كرت إحصائي لكل قالب: إجمالي + شريط نسبة النجاح + نجاح/فشل
function TemplateStatCard({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm truncate">{data.template}</span>
        <span className="text-xs text-gray-400">{data.total} رسالة</span>
      </div>
      <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
        <div className="bg-green-500 h-2" style={{ width: `${data.success_rate}%` }} />
      </div>
      <div className="flex justify-between text-[11px] mt-1.5">
        <span className="text-green-600">ناجحة: {data.sent}</span>
        <span className="text-sky-600 font-semibold">{data.success_rate}%</span>
        <span className="text-red-500">فاشلة: {data.failed}</span>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm min-w-[140px]"
      >
        <option value="">الكل</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
