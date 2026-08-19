import { useEffect, useState } from 'react';
import { RefreshCw, Search, Eye } from 'lucide-react';
import api from '../lib/axios';
import { useTemplateStore } from '../stores/templateStore';
import { useRealtimeTemplates } from '../hooks/useRealtimeTemplates';
import { useCan } from '../hooks/useCan';
import TemplatePreview from '../components/templates/TemplatePreview';

const STATUS = {
  approved: { label: 'معتمد', cls: 'bg-emerald-500/10 text-emerald-500' },
  pending:  { label: 'قيد المراجعة', cls: 'bg-amber-500/10 text-amber-500' },
  rejected: { label: 'مرفوض', cls: 'bg-rose-500/10 text-rose-500' },
};
const CATEGORY = { marketing: 'تسويقي', utility: 'خدمي', authentication: 'مصادقة' };

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

  const templates = allTemplates.filter((t) => {
    const byStatus = statusFilter === 'all' || t.status === statusFilter;
    const byName = !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase());
    return byStatus && byName;
  });

  useEffect(() => {
    api.get('/whatsapp-accounts').then(({ data }) => {
      setAccounts(data.data); setAccountId(data.data?.[0]?.id ?? null);
    });
  }, []);
  useEffect(() => { if (accountId) load(accountId); }, [accountId]);

  const sync = async () => {
    setSyncing(true); setNotice(null);
    try {
      const { data } = await api.post(`/settings/whatsapp-accounts/${accountId}/sync-templates`);
      setNotice(data.message ?? 'بدأت المزامنة.');
    } catch { setNotice('تعذّرت المزامنة.'); } finally { setSyncing(false); }
  };

  const counts = allTemplates.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:p-8 max-w-5xl mx-auto" dir="rtl">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-content">القوالب</h1>
          <div className="flex items-center gap-3">
            <select value={accountId ?? ''} onChange={(e) => setAccountId(Number(e.target.value) || null)}
              className="input !w-auto !py-2">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            {can('accounts.manage') && (
              <button onClick={sync} disabled={syncing || !accountId} className="btn-primary btn-sm">
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'جارِ المزامنة...' : 'مزامنة من Meta'}
              </button>
            )}
          </div>
        </div>

        {notice && <div className="mb-4 rounded-xl bg-sky-500/10 text-sky-500 text-sm p-3">{notice}</div>}

        {/* ملخّص الحالات */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Summary label="الكل" value={allTemplates.length} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} tint="text-content" />
          <Summary label="معتمد" value={counts.approved ?? 0} active={statusFilter === 'approved'} onClick={() => setStatusFilter('approved')} tint="text-emerald-500" />
          <Summary label="قيد المراجعة" value={counts.pending ?? 0} active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} tint="text-amber-500" />
          <Summary label="مرفوض" value={counts.rejected ?? 0} active={statusFilter === 'rejected'} onClick={() => setStatusFilter('rejected')} tint="text-rose-500" />
        </div>

        {/* بحث */}
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث باسم القالب..."
            className="input ps-9" />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-muted text-xs">
                <tr>
                  <th className="text-start p-3 font-semibold">الاسم</th>
                  <th className="text-start p-3 font-semibold">اللغة</th>
                  <th className="text-start p-3 font-semibold">التصنيف</th>
                  <th className="text-start p-3 font-semibold">الحالة</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading && <tr><td colSpan={5} className="p-6 text-center text-muted">جارِ التحميل...</td></tr>}
                {!loading && templates.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted">
                    {allTemplates.length === 0 ? 'لا توجد قوالب — جرّب المزامنة من Meta.' : 'لا نتائج مطابقة.'}
                  </td></tr>
                )}
                {templates.map((t) => {
                  const s = STATUS[t.status] ?? { label: t.status, cls: 'bg-slate-500/10 text-slate-400' };
                  return (
                    <tr key={t.id} className="hover:bg-surface-2/50 cursor-pointer transition" onClick={() => setPreview(t)}>
                      <td className="p-3 font-medium text-content">{t.name}</td>
                      <td className="p-3 text-muted" dir="ltr">{t.language}</td>
                      <td className="p-3 text-muted">{CATEGORY[t.category] ?? t.category ?? '—'}</td>
                      <td className="p-3"><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td className="p-3 text-brand"><Eye size={16} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <TemplatePreview template={preview} onClose={() => setPreview(null)} />
      </div>
    </div>
  );
}

function Summary({ label, value, tint, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`card p-3 flex items-center gap-2.5 transition ${active ? 'ring-2 ring-brand/40' : 'card-hover'}`}>
      <span className={`text-xl font-bold ${tint}`}>{value}</span>
      <span className="text-muted text-xs">{label}</span>
    </button>
  );
}
