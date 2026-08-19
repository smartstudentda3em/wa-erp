import { useEffect, useState } from 'react';
import { useTeamStore } from '../stores/teamStore';
import { useCan } from '../hooks/useCan';

// وسوم العرض
const AVAIL = {
  available: { label: 'متاح', dot: 'bg-green-500', chip: 'bg-green-100 text-green-700' },
  away: { label: 'بالخارج', dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700' },
  offline: { label: 'غير متصل', dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-500' },
};
const ROLES = { admin: 'مدير النظام', manager: 'مشرف', agent: 'مبيعات' };

// صفحة إدارة الفريق: الأقسام (الأنشطة) + موظفو المبيعات — admin فقط
export default function SettingsTeamPage() {
  const can = useCan();
  const { departments, members, loading, loadAll } = useTeamStore();

  useEffect(() => { loadAll(); }, []);

  if (!can('accounts.manage')) {
    return <div className="p-6 text-center text-gray-400">لا تملك صلاحية إدارة الفريق.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-full" dir="rtl">
      <h1 className="text-xl font-bold mb-1">إدارة الفريق والأنشطة</h1>
      <p className="text-sm text-gray-400 mb-6">
        اربط كل موظف مبيعات بنشاطه، وكل رقم واتساب بنشاطه، عشان توزيع الرسائل يشتغل تلقائيًا.
      </p>

      <DepartmentsSection departments={departments} loading={loading} />
      <MembersSection members={members} departments={departments} loading={loading} />
    </div>
  );
}

/* ============================ الأقسام ============================ */
function DepartmentsSection({ departments, loading }) {
  const [editing, setEditing] = useState(null); // 'new' | dept | null

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-gray-700">الأنشطة / الأقسام</h2>
        <button onClick={() => setEditing('new')}
          className="text-sm bg-green-500 text-white rounded-lg px-3 py-1.5 hover:bg-green-600">
          + قسم جديد
        </button>
      </div>

      {editing && (
        <DepartmentForm
          department={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      <div className="bg-white rounded-2xl shadow divide-y">
        {loading && <p className="p-4 text-center text-gray-400 text-sm">جارِ التحميل...</p>}
        {departments.map((d) => (
          <div key={d.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium flex items-center gap-2">
                {d.name}
                {!d.is_active && <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">معطّل</span>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {d.code ? `كود: ${d.code} · ` : ''}{d.users_count} موظف
              </div>
            </div>
            <button onClick={() => setEditing(d)} className="text-sm text-sky-600 hover:underline">تعديل</button>
          </div>
        ))}
        {!loading && departments.length === 0 && (
          <p className="p-4 text-center text-gray-400 text-sm">لا توجد أقسام بعد.</p>
        )}
      </div>
    </section>
  );
}

function DepartmentForm({ department, onDone }) {
  const { saveDepartment } = useTeamStore();
  const isEdit = Boolean(department);
  const [form, setForm] = useState({
    name: department?.name ?? '',
    code: department?.code ?? '',
    is_active: department?.is_active ?? true,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null); setSaving(true);
    try {
      await saveDepartment({ ...form, code: form.code || null }, department?.id);
      onDone();
    } catch (e) {
      setError(e.response?.data?.message ?? 'تعذّر الحفظ.');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5 mb-3 space-y-3 border-2 border-green-100">
      <h3 className="font-bold text-sm">{isEdit ? 'تعديل قسم' : 'إضافة قسم'}</h3>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="اسم النشاط" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="التكييف" />
        <Field label="كود للتوجيه (اختياري)" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} placeholder="ac" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
        القسم مفعّل
      </label>
      <FormButtons saving={saving} onSubmit={submit} onCancel={onDone} />
    </div>
  );
}

/* ========================= فريق المبيعات ========================= */
function MembersSection({ members, departments, loading }) {
  const [editing, setEditing] = useState(null);

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-gray-700">فريق المبيعات والموظفون</h2>
        <button onClick={() => setEditing('new')}
          className="text-sm bg-green-500 text-white rounded-lg px-3 py-1.5 hover:bg-green-600">
          + موظف جديد
        </button>
      </div>

      {editing && (
        <MemberForm
          member={editing === 'new' ? null : editing}
          departments={departments}
          onDone={() => setEditing(null)}
        />
      )}

      <div className="bg-white rounded-2xl shadow divide-y">
        {loading && <p className="p-4 text-center text-gray-400 text-sm">جارِ التحميل...</p>}
        {members.map((m) => {
          const av = AVAIL[m.availability] ?? AVAIL.offline;
          return (
            <div key={m.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${av.dot}`} title={av.label} />
                  {m.name}
                  {!m.is_active && <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">معطّل</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{m.phone}</span>
                  <span className="text-gray-300">·</span>
                  <span>{ROLES[m.role] ?? m.role ?? '—'}</span>
                  <span className="text-gray-300">·</span>
                  <span>{m.department?.name ?? 'بلا قسم'}</span>
                  <span className={`rounded-full px-2 py-0.5 ${av.chip}`}>{av.label}</span>
                </div>
              </div>
              <button onClick={() => setEditing(m)} className="text-sm text-sky-600 hover:underline">تعديل</button>
            </div>
          );
        })}
        {!loading && members.length === 0 && (
          <p className="p-4 text-center text-gray-400 text-sm">لا يوجد موظفون بعد.</p>
        )}
      </div>
    </section>
  );
}

function MemberForm({ member, departments, onDone }) {
  const { saveMember } = useTeamStore();
  const isEdit = Boolean(member);
  const [form, setForm] = useState({
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    password: '',
    department_id: member?.department_id ?? '',
    role: member?.role ?? 'agent',
    availability: member?.availability ?? 'available',
    is_active: member?.is_active ?? true,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const upd = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null); setSaving(true);
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? Number(form.department_id) : null,
      };
      if (isEdit && !payload.password) delete payload.password; // فارغة = إبقاء الحالية
      await saveMember(payload, member?.id);
      onDone();
    } catch (e) {
      setError(e.response?.data?.message ?? 'تعذّر الحفظ. تحقّق من الحقول (الهاتف قد يكون مستخدَمًا).');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5 mb-3 space-y-3 border-2 border-green-100">
      <h3 className="font-bold text-sm">{isEdit ? 'تعديل موظف' : 'إضافة موظف'}</h3>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <Field label="الاسم" value={form.name} onChange={upd('name')} placeholder="أحمد" />
        <Field label="الهاتف (اسم الدخول)" value={form.phone} onChange={upd('phone')} placeholder="9665xxxxxxxx" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            كلمة السر {isEdit && <span className="text-xs text-gray-400">(فارغة = إبقاء الحالية)</span>}
          </label>
          <input type="password" value={form.password} onChange={(e) => upd('password')(e.target.value)}
            placeholder={isEdit ? '••••••' : '6 أحرف على الأقل'}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <Select label="القسم / النشاط" value={form.department_id} onChange={upd('department_id')}
          options={[{ value: '', label: 'بلا قسم' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="الدور" value={form.role} onChange={upd('role')}
          options={[{ value: 'agent', label: 'مبيعات' }, { value: 'manager', label: 'مشرف' }, { value: 'admin', label: 'مدير النظام' }]} />
        <Select label="الحالة" value={form.availability} onChange={upd('availability')}
          options={[{ value: 'available', label: 'متاح' }, { value: 'away', label: 'بالخارج' }, { value: 'offline', label: 'غير متصل' }]} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_active} onChange={(e) => upd('is_active')(e.target.checked)} />
        الحساب مفعّل (المعطّل لا يستقبل توزيعًا)
      </label>

      <FormButtons saving={saving} onSubmit={submit} onCancel={onDone} />
    </div>
  );
}

/* ============================ عناصر مشتركة ============================ */
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
        {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function FormButtons({ saving, onSubmit, onCancel }) {
  return (
    <div className="flex gap-3 pt-1">
      <button onClick={onSubmit} disabled={saving}
        className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 disabled:opacity-50">
        {saving ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
      <button onClick={onCancel} className="border rounded-lg px-4 py-2 hover:bg-gray-50">إلغاء</button>
    </div>
  );
}
