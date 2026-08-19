import { useEffect, useState } from 'react';
import { Download, RotateCw, Check, X } from 'lucide-react';
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
    try { await exportExcel(); }
    catch { pushToast({ type: 'error', message: 'تعذّر التصدير.' }); }
    finally { setExporting(false); }
  };

  if (!can('campaigns.manage')) {
    return <div className="p-8 text-center text-muted">لا تملك صلاحية عرض سجل الاختبارات.</div>;
  }

  const onResend = async (id) => {
    setResendingId(id);
    try {
      const msg = await resend(id);
      pushToast({ type: 'success', message: msg ?? 'تمت إعادة الإرسال.' });
    } catch (e) {
      pushToast({ type: 'error', message: e.response?.data?.message ?? 'فشلت إعادة الإرسال.' });
    } finally { setResendingId(null); }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:p-8 max-w-5xl mx-auto" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-content">سجل رسائل الاختبار</h1>
          <button onClick={onExport} disabled={exporting} className="btn-primary btn-sm">
            <Download size={15} /> {exporting ? 'جارِ التصدير...' : 'تصدير Excel'}
          </button>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard label="إجمالي الرسائل" value={stats.overall.total} tint="text-content" />
              <StatCard label="ناجحة" value={stats.overall.sent} tint="text-emerald-500" />
              <StatCard label="فاشلة" value={stats.overall.failed} tint="text-rose-500" />
              <StatCard label="نسبة النجاح" value={`${stats.overall.success_rate}%`} tint="text-sky-500" />
            </div>

            {stats.by_template.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted mb-2">حسب القالب</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.by_template.map((t, i) => <TemplateStatCard key={i} data={t} />)}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <Select label="الحالة" value={filters.status} onChange={(v) => setFilter('status', v)}
            options={[{ value: 'sent', label: 'ناجحة' }, { value: 'failed', label: 'فاشلة' }]} />
          <Select label="المُرسِل" value={filters.user_id} onChange={(v) => setFilter('user_id', v)}
            options={filterOptions.users.map((u) => ({ value: u.id, label: u.name }))} />
          <Select label="القالب" value={filters.template_id} onChange={(v) => setFilter('template_id', v)}
            options={filterOptions.templates.map((t) => ({ value: t.id, label: t.name }))} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-muted text-xs">
                <tr>
                  <th className="text-start p-3 font-semibold">الحالة</th>
                  <th className="text-start p-3 font-semibold">الرقم</th>
                  <th className="text-start p-3 font-semibold">القالب</th>
                  <th className="text-start p-3 font-semibold">المُرسِل</th>
                  <th className="text-start p-3 font-semibold">الوقت</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading && <tr><td colSpan={6} className="p-6 text-center text-muted">جارِ التحميل...</td></tr>}
                {!loading && logs.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">لا سجلّات مطابقة.</td></tr>}
                {logs.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-2/50 transition">
                    <td className="p-3">
                      {t.status === 'sent'
                        ? <span className="badge bg-emerald-500/10 text-emerald-500"><Check size={12} /> ناجحة</span>
                        : <span className="badge bg-rose-500/10 text-rose-500" title={t.error}><X size={12} /> فاشلة</span>}
                    </td>
                    <td className="p-3 font-mono text-xs text-content" dir="ltr">{t.to}</td>
                    <td className="p-3 text-muted">{t.template ?? '—'}</td>
                    <td className="p-3 text-muted">{t.user ?? '—'}</td>
                    <td className="p-3 text-muted text-xs">
                      {new Date(t.created_at).toLocaleString('ar', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <button onClick={() => onResend(t.id)} disabled={resendingId === t.id}
                        className="inline-flex items-center gap-1 text-xs text-sky-500 hover:underline disabled:opacity-50">
                        <RotateCw size={13} className={resendingId === t.id ? 'animate-spin' : ''} />
                        {resendingId === t.id ? '...' : 'إعادة إرسال'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.last > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 text-sm">
            <button disabled={pagination.current <= 1} onClick={() => load(pagination.current - 1)} className="btn-outline btn-sm">السابق</button>
            <span className="text-muted">{pagination.current} / {pagination.last}</span>
            <button disabled={pagination.current >= pagination.last} onClick={() => load(pagination.current + 1)} className="btn-outline btn-sm">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tint }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold ${tint}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function TemplateStatCard({ data }) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm text-content truncate">{data.template}</span>
        <span className="text-xs text-muted">{data.total} رسالة</span>
      </div>
      <div className="w-full bg-rose-500/15 rounded-full h-2 overflow-hidden">
        <div className="bg-emerald-500 h-2" style={{ width: `${data.success_rate}%` }} />
      </div>
      <div className="flex justify-between text-[11px] mt-1.5">
        <span className="text-emerald-500">ناجحة: {data.sent}</span>
        <span className="text-sky-500 font-semibold">{data.success_rate}%</span>
        <span className="text-rose-500">فاشلة: {data.failed}</span>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input !py-2 min-w-[140px]">
        <option value="">الكل</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
