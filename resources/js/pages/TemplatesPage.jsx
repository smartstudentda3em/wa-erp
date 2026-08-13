import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { useTemplateStore } from '../stores/templateStore';
import { useRealtimeTemplates } from '../hooks/useRealtimeTemplates';
import { useCan } from '../hooks/useCan';
import TemplatePreview from '../components/templates/TemplatePreview';

const STATUS = {
  approved: { label: 'معتمد', cls: 'bg-green-100 text-green-700' },
  pending:  { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-700' },
};

const CATEGORY = {
  marketing: 'تسويقي',
  utility: 'خدمي',
  authentication: 'مصادقة',
};

// صفحة عرض القوالب لكل حساب مع حالاتها الملوّنة — تتحدّث لحظياً عبر Reverb
export default function TemplatesPage() {
  const can = useCan();
  const load = useTemplateStore((s) => s.load);
  const loading = useTemplateStore((s) => s.loading);

  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const allTemplates = useTemplateStore((s) => s.get(accountId, false));
  useRealtimeTemplates(accountId);

  // فلترة بالاسم والحالة (على العميل)
  const templates = allTemplates.filter((t) => {
    const byStatus = statusFilter === 'all' || t.status === statusFilter;
    const byName = !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase());
    return byStatus && byName;
  });

  useEffect(() => {
    api.get('/whatsapp-accounts').then(({ data }) => {
      setAccounts(data.data);
      setAccountId(data.data?.[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (accountId) load(accountId);
  }, [accountId]);

  const sync = async () => {
    setSyncing(true);
    setNotice(null);
    try {
      const { data } = await api.post(`/settings/whatsapp-accounts/${accountId}/sync-templates`);
      setNotice(data.message ?? 'بدأت المزامنة.');
    } catch {
      setNotice('تعذّرت المزامنة.');
    } finally {
      setSyncing(false);
    }
  };

  // الأعداد من القائمة الكاملة (لا المفلترة)
  const counts = allTemplates.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">القوالب</h1>
        <div className="flex items-center gap-3">
          <select
            value={accountId ?? ''}
            onChange={(e) => setAccountId(Number(e.target.value) || null)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          {can('accounts.manage') && (
            <button
              onClick={sync}
              disabled={syncing || !accountId}
              className="bg-green-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-600 disabled:opacity-50"
            >
              {syncing ? 'جارِ المزامنة...' : 'مزامنة من Meta'}
            </button>
          )}
        </div>
      </div>

      {notice && <div className="mb-4 bg-sky-50 text-sky-700 text-sm rounded-lg p-3">{notice}</div>}

      {/* ملخّص الحالات (قابل للنقر للفلترة) */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <Summary label="الكل" value={allTemplates.length} cls="text-gray-700"
                 active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <Summary label="معتمد" value={counts.approved ?? 0} cls="text-green-700"
                 active={statusFilter === 'approved'} onClick={() => setStatusFilter('approved')} />
        <Summary label="قيد المراجعة" value={counts.pending ?? 0} cls="text-amber-700"
                 active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
        <Summary label="مرفوض" value={counts.rejected ?? 0} cls="text-red-700"
                 active={statusFilter === 'rejected'} onClick={() => setStatusFilter('rejected')} />
      </div>

      {/* بحث بالاسم */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث باسم القالب..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">اللغة</th>
              <th className="text-right p-3">التصنيف</th>
              <th className="text-right p-3">الحالة</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">جارِ التحميل...</td></tr>
            )}
            {!loading && templates.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">
                {allTemplates.length === 0 ? 'لا توجد قوالب — جرّب المزامنة من Meta.' : 'لا نتائج مطابقة للبحث/الفلتر.'}
              </td></tr>
            )}
            {templates.map((t) => {
              const s = STATUS[t.status] ?? { label: t.status, cls: 'bg-gray-100 text-gray-600' };
              return (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setPreview(t)}>
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3 text-gray-500">{t.language}</td>
                  <td className="p-3 text-gray-500">{CATEGORY[t.category] ?? t.category ?? '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs rounded-full px-3 py-1 ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="p-3 text-sky-600 text-xs">معاينة</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TemplatePreview template={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function Summary({ label, value, cls, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl shadow px-4 py-2 flex items-center gap-2 transition
        ${active ? 'bg-green-50 ring-2 ring-green-400' : 'bg-white hover:bg-gray-50'}`}
    >
      <span className={`text-lg font-bold ${cls}`}>{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </button>
  );
}
