import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Pencil, MessageCircle } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { useTeamStore } from '../stores/teamStore';
import { useCan } from '../hooks/useCan';
import Modal from '../components/ui/Modal';
import AccountForm from '../components/settings/AccountForm';

// صفحة إعدادات حسابات واتساب — admin فقط (accounts.manage)
export default function SettingsAccountsPage() {
  const { accounts, loadAccounts, loading, syncTemplates } = useAccountStore();
  const { departments, loadDepartments } = useTeamStore();
  const can = useCan();
  const [editing, setEditing] = useState(null); // 'new' | account | null
  const [syncingId, setSyncingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const deptName = (id) => departments.find((d) => d.id === id)?.name;

  useEffect(() => { loadAccounts(); loadDepartments(); }, []);

  const onSync = async (id) => {
    setSyncingId(id); setNotice(null);
    try { setNotice(await syncTemplates(id) ?? 'بدأت المزامنة.'); }
    catch { setNotice('تعذّرت المزامنة.'); }
    finally { setSyncingId(null); }
  };

  if (!can('accounts.manage')) {
    return <div className="p-8 text-center text-muted">لا تملك صلاحية إدارة الحسابات.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:p-8 max-w-4xl mx-auto" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-content">حسابات واتساب</h1>
          <button onClick={() => setEditing('new')} className="btn-primary btn-sm"><Plus size={16} /> إضافة حساب</button>
        </div>

        {notice && <div className="mb-4 rounded-xl bg-sky-500/10 text-sky-500 text-sm p-3">{notice}</div>}

        <div className="card divide-y divide-line overflow-hidden">
          {loading && <p className="p-6 text-center text-muted text-sm">جارِ التحميل...</p>}
          {accounts.map((a) => (
            <div key={a.id} className="p-4 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0"><MessageCircle size={20} /></div>
                <div className="min-w-0">
                  <div className="font-semibold text-content flex items-center gap-2 flex-wrap">
                    {a.label}
                    <span className={`badge ${a.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                      {a.is_active ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    <span dir="ltr">{a.display_phone_number}</span> · نشاط: {deptName(a.department_id) ?? 'غير محدد'}
                    {a.daily_limit ? ` · حد يومي: ${a.daily_limit}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onSync(a.id)} disabled={syncingId === a.id} className="btn-icon" title="مزامنة القوالب">
                  <RefreshCw size={17} className={syncingId === a.id ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setEditing(a)} className="btn-icon" title="تعديل"><Pencil size={16} /></button>
              </div>
            </div>
          ))}
          {!loading && accounts.length === 0 && (
            <p className="p-8 text-center text-muted text-sm">لا توجد حسابات — أضف حسابك الأول.</p>
          )}
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg" icon={<MessageCircle size={20} />}
        title={editing && editing !== 'new' ? 'تعديل حساب' : 'إضافة حساب واتساب'}
        subtitle="بيانات الربط مع Meta Cloud API">
        {editing && (
          <AccountForm
            account={editing === 'new' ? null : editing}
            departments={departments}
            onSaved={() => { setEditing(null); loadAccounts(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
