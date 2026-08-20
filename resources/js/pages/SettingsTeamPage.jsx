import { useEffect, useState } from 'react';
import {
  Snowflake, PenTool, Printer, Building2, Users, Wifi, Layers,
  Plus, Pencil, Hash, Trash2,
} from 'lucide-react';
import { useTeamStore } from '../stores/teamStore';
import { useCan } from '../hooks/useCan';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import StatusDot from '../components/ui/StatusDot';

/* أنماط العرض */
const ROLE = {
  admin: { label: 'مدير النظام', cls: 'bg-violet-500/10 text-violet-500' },
  manager: { label: 'مشرف', cls: 'bg-sky-500/10 text-sky-500' },
  agent: { label: 'مبيعات', cls: 'bg-emerald-500/10 text-emerald-500' },
};
const AVAIL = {
  available: { label: 'متاح', cls: 'bg-emerald-500/10 text-emerald-500' },
  away: { label: 'بالخارج', cls: 'bg-amber-500/10 text-amber-500' },
  offline: { label: 'غير متصل', cls: 'bg-slate-500/10 text-slate-400' },
};
const DEPT_GRAD = [
  'from-sky-500 to-cyan-500',
  'from-violet-500 to-fuchsia-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
];
function deptIcon(d) {
  const s = `${d.code || ''} ${d.name || ''}`.toLowerCase();
  if (/ac|كييف|تبريد/.test(s)) return Snowflake;
  if (/print|طبع|مطبعة/.test(s)) return Printer;
  if (/stationery|قرطاس/.test(s)) return PenTool;
  return Building2;
}

export default function SettingsTeamPage() {
  const can = useCan();
  const { departments, members, loading, loadAll } = useTeamStore();
  const [deptModal, setDeptModal] = useState(null);   // 'new' | dept | null
  const [memberModal, setMemberModal] = useState(null);

  useEffect(() => { loadAll(); }, []);

  if (!can('accounts.manage')) {
    return <div className="p-8 text-center text-muted">لا تملك صلاحية إدارة الفريق.</div>;
  }

  const online = members.filter((m) => m.availability === 'available' && m.is_active).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 md:p-8" dir="rtl">
        {/* الترويسة */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-content">إدارة الفريق والأنشطة</h1>
            <p className="text-sm text-muted mt-1">اربط كل موظف ورقم واتساب بنشاطه ليعمل التوزيع التلقائي.</p>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          <StatCard icon={<Layers size={18} />} tint="bg-brand/10 text-brand" value={departments.length} label="نشاط" />
          <StatCard icon={<Users size={18} />} tint="bg-sky-500/10 text-sky-500" value={members.length} label="موظف" />
          <StatCard icon={<Wifi size={18} />} tint="bg-emerald-500/10 text-emerald-500" value={online} label="متاح الآن" />
        </div>

        {/* ===== الأقسام ===== */}
        <SectionHead title="الأنشطة / الأقسام" onAdd={() => setDeptModal('new')} addLabel="قسم جديد" />
        {loading && departments.length === 0 && <Skeleton rows={3} grid />}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {departments.map((d, i) => {
            const Icon = deptIcon(d);
            return (
              <div key={d.id} className="card card-hover p-5 group">
                <div className="flex items-start justify-between">
                  <div className={`grid place-items-center w-12 h-12 rounded-2xl text-white shadow-lg bg-gradient-to-br ${DEPT_GRAD[i % DEPT_GRAD.length]}`}>
                    <Icon size={22} />
                  </div>
                  <button onClick={() => setDeptModal(d)} className="btn-icon opacity-0 group-hover:opacity-100 transition" title="تعديل">
                    <Pencil size={16} />
                  </button>
                </div>
                <h3 className="mt-4 font-bold text-content text-lg">{d.name}</h3>
                {d.code && (
                  <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                    <Hash size={12} />{d.code}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                    <Users size={15} /> {d.users_count} موظف
                  </span>
                  <span className={`badge ${d.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${d.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {d.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </div>
              </div>
            );
          })}
          {!loading && departments.length === 0 && <Empty text="لا توجد أقسام بعد." />}
        </div>

        {/* ===== الموظفون ===== */}
        <SectionHead title="فريق المبيعات والموظفون" onAdd={() => setMemberModal('new')} addLabel="موظف جديد" />
        <div className="card divide-y divide-line overflow-hidden">
          {loading && members.length === 0 && <Skeleton rows={4} />}
          {members.map((m) => {
            const role = ROLE[m.role] ?? { label: m.role ?? '—', cls: 'bg-slate-500/10 text-slate-400' };
            const av = AVAIL[m.availability] ?? AVAIL.offline;
            return (
              <div key={m.id} className="flex items-center gap-3.5 px-4 py-3 hover:bg-surface-2/50 transition group">
                <div className="relative">
                  <Avatar name={m.name} />
                  <span className="absolute -bottom-0.5 -left-0.5"><StatusDot status={m.availability} /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-content truncate">{m.name}</span>
                    <span className={`badge ${role.cls}`}>{role.label}</span>
                    {!m.is_active && <span className="badge bg-slate-500/10 text-slate-400">معطّل</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span dir="ltr">{m.phone}</span>
                    <span className="text-line">•</span>
                    <span>{m.department?.name ?? 'بلا قسم'}</span>
                  </div>
                </div>
                <span className={`badge ${av.cls} hidden sm:inline-flex`}>{av.label}</span>
                <button onClick={() => setMemberModal(m)} className="btn-icon opacity-60 group-hover:opacity-100 transition" title="تعديل">
                  <Pencil size={16} />
                </button>
              </div>
            );
          })}
          {!loading && members.length === 0 && <Empty text="لا يوجد موظفون بعد." />}
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      <Modal open={!!deptModal} onClose={() => setDeptModal(null)} icon={<Building2 size={20} />}
        title={deptModal && deptModal !== 'new' ? 'تعديل قسم' : 'إضافة قسم'}
        subtitle="نشاط تجاري يُوزَّع عليه الرسائل">
        {deptModal && <DepartmentForm department={deptModal === 'new' ? null : deptModal} onDone={() => setDeptModal(null)} />}
      </Modal>

      <Modal open={!!memberModal} onClose={() => setMemberModal(null)} size="lg" icon={<Users size={20} />}
        title={memberModal && memberModal !== 'new' ? 'تعديل موظف' : 'إضافة موظف'}
        subtitle="بيانات الدخول والدور والقسم والحالة">
        {memberModal && <MemberForm member={memberModal === 'new' ? null : memberModal} departments={departments} onDone={() => setMemberModal(null)} />}
      </Modal>
    </div>
  );
}

/* ============================ عناصر مساعدة ============================ */
function StatCard({ icon, tint, value, label }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`grid place-items-center w-11 h-11 rounded-xl ${tint}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-content leading-none">{value}</div>
        <div className="text-xs text-muted mt-1">{label}</div>
      </div>
    </div>
  );
}

function SectionHead({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-content">{title}</h2>
      <button onClick={onAdd} className="btn-primary btn-sm">
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-8 text-center text-muted text-sm">{text}</div>;
}

function Skeleton({ rows = 3, grid = false }) {
  const arr = Array.from({ length: rows });
  if (grid) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {arr.map((_, i) => <div key={i} className="card p-5 h-40 animate-pulse bg-surface-2/50" />)}
      </div>
    );
  }
  return arr.map((_, i) => <div key={i} className="h-16 animate-pulse bg-surface-2/40" />);
}

/* ============================ النماذج ============================ */
function DepartmentForm({ department, onDone }) {
  const { saveDepartment, deleteDepartment } = useTeamStore();
  const isEdit = Boolean(department);
  const [form, setForm] = useState({
    name: department?.name ?? '', code: department?.code ?? '', is_active: department?.is_active ?? true,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null); setSaving(true);
    try { await saveDepartment({ ...form, code: form.code || null }, department?.id); onDone(); }
    catch (e) { setError(e.response?.data?.message ?? 'تعذّر الحفظ.'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setError(null); setSaving(true);
    try { await deleteDepartment(department.id); onDone(); }
    catch (e) { setError(e.response?.data?.message ?? 'تعذّر الحذف.'); setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <FormError msg={error} />}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">اسم النشاط</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="التكييف" />
        </div>
        <div>
          <label className="label">كود التوجيه <span className="text-muted font-normal">(اختياري)</span></label>
          <input className="input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="ac" dir="ltr" />
        </div>
      </div>
      <Toggle checked={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} label="القسم مفعّل" />
      <FormActions saving={saving} onSubmit={submit} onCancel={onDone} onDelete={isEdit ? del : undefined} />
    </div>
  );
}

function MemberForm({ member, departments, onDone }) {
  const { saveMember, deleteMember } = useTeamStore();
  const isEdit = Boolean(member);
  const [form, setForm] = useState({
    name: member?.name ?? '', phone: member?.phone ?? '', password: '',
    department_id: member?.department_id ?? '', role: member?.role ?? 'agent',
    availability: member?.availability ?? 'available', is_active: member?.is_active ?? true,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const submit = async () => {
    setError(null); setSaving(true);
    try {
      const payload = { ...form, department_id: form.department_id ? Number(form.department_id) : null };
      if (isEdit && !payload.password) delete payload.password;
      await saveMember(payload, member?.id); onDone();
    } catch (e) {
      setError(e.response?.data?.message ?? 'تعذّر الحفظ. تحقّق من الحقول (الهاتف قد يكون مستخدَمًا).');
    } finally { setSaving(false); }
  };

  const del = async () => {
    setError(null); setSaving(true);
    try { await deleteMember(member.id); onDone(); }
    catch (e) { setError(e.response?.data?.message ?? 'تعذّر الحذف.'); setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <FormError msg={error} />}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">الاسم</label>
          <input className="input" value={form.name} onChange={upd('name')} placeholder="أحمد" />
        </div>
        <div>
          <label className="label">الهاتف (اسم الدخول)</label>
          <input className="input" value={form.phone} onChange={upd('phone')} placeholder="9665xxxxxxxx" dir="ltr" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">كلمة السر {isEdit && <span className="text-muted font-normal">(فارغة = إبقاء)</span>}</label>
          <input type="password" className="input" value={form.password} onChange={upd('password')} placeholder={isEdit ? '••••••' : '6 أحرف على الأقل'} />
        </div>
        <div>
          <label className="label">القسم / النشاط</label>
          <select className="input" value={form.department_id} onChange={upd('department_id')}>
            <option value="">بلا قسم</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">الدور</label>
          <select className="input" value={form.role} onChange={upd('role')}>
            <option value="agent">مبيعات</option>
            <option value="manager">مشرف</option>
            <option value="admin">مدير النظام</option>
          </select>
        </div>
        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.availability} onChange={upd('availability')}>
            <option value="available">متاح</option>
            <option value="away">بالخارج</option>
            <option value="offline">غير متصل</option>
          </select>
        </div>
      </div>
      <Toggle checked={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} label="الحساب مفعّل (المعطّل لا يستقبل توزيعًا)" />
      <FormActions saving={saving} onSubmit={submit} onCancel={onDone} onDelete={isEdit ? del : undefined} />
    </div>
  );
}

function FormError({ msg }) {
  return <div className="rounded-xl bg-rose-500/10 text-rose-500 text-sm px-3.5 py-2.5">{msg}</div>;
}

function FormActions({ saving, onSubmit, onCancel, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex gap-3 pt-2 items-center">
      <button onClick={onSubmit} disabled={saving} className="btn-primary flex-1">
        {saving ? 'جارِ الحفظ...' : 'حفظ'}
      </button>
      <button onClick={onCancel} className="btn-outline">إلغاء</button>
      {onDelete && (confirm ? (
        <button type="button" onClick={onDelete} disabled={saving}
          className="btn bg-rose-500 text-white hover:bg-rose-600">
          تأكيد الحذف
        </button>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} disabled={saving}
          className="btn-icon text-rose-500 hover:bg-rose-500/10" title="حذف">
          <Trash2 size={17} />
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-sm text-content">
      <span className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'right-0.5' : 'right-[18px]'}`} />
      </span>
      {label}
    </button>
  );
}
