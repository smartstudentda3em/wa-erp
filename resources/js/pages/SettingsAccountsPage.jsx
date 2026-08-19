import { useEffect, useState } from 'react';
import { useAccountStore } from '../stores/accountStore';
import { useTeamStore } from '../stores/teamStore';
import { useCan } from '../hooks/useCan';
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
    setSyncingId(id);
    setNotice(null);
    try {
      const msg = await syncTemplates(id);
      setNotice(msg ?? 'بدأت المزامنة.');
    } catch {
      setNotice('تعذّرت المزامنة.');
    } finally {
      setSyncingId(null);
    }
  };

  if (!can('accounts.manage')) {
    return <div className="p-6 text-center text-gray-400">لا تملك صلاحية إدارة الحسابات.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">حسابات واتساب</h1>
        <button
          onClick={() => setEditing('new')}
          className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600"
        >
          + إضافة حساب
        </button>
      </div>

      {notice && (
        <div className="mb-4 bg-sky-50 text-sky-700 text-sm rounded-lg p-3">{notice}</div>
      )}

      {editing && (
        <div className="mb-6">
          <AccountForm
            account={editing === 'new' ? null : editing}
            departments={departments}
            onSaved={() => { setEditing(null); loadAccounts(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow divide-y">
        {loading && <p className="p-4 text-center text-gray-400 text-sm">جارِ التحميل...</p>}
        {accounts.map((a) => (
          <div key={a.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium flex items-center gap-2">
                {a.label}
                <span className={`text-[11px] rounded-full px-2 py-0.5 ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.is_active ? 'مفعّل' : 'معطّل'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {a.display_phone_number} · ID: {a.phone_number_id}
                {a.daily_limit ? ` · حد يومي: ${a.daily_limit}` : ''}
                {` · نشاط: ${deptName(a.department_id) ?? 'غير محدد'}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSync(a.id)}
                disabled={syncingId === a.id}
                className="text-sm text-green-600 hover:underline disabled:opacity-50"
              >
                {syncingId === a.id ? 'جارِ المزامنة...' : 'مزامنة القوالب'}
              </button>
              <button
                onClick={() => setEditing(a)}
                className="text-sm text-sky-600 hover:underline"
              >
                تعديل
              </button>
            </div>
          </div>
        ))}
        {!loading && accounts.length === 0 && (
          <p className="p-4 text-center text-gray-400 text-sm">لا توجد حسابات — أضف حسابك الأول.</p>
        )}
      </div>
    </div>
  );
}
