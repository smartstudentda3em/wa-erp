import { useState } from 'react';
import { useAccountStore } from '../../stores/accountStore';

const EMPTY = {
  label: '', display_phone_number: '', phone_number_id: '', waba_id: '',
  access_token: '', webhook_verify_token: '', daily_limit: '', is_active: true, department_id: '',
};

// نموذج إضافة/تعديل حساب واتساب (يُعرض داخل Modal). عند التعديل: اترك التوكن فارغاً للإبقاء عليه.
export default function AccountForm({ account, departments = [], onSaved, onCancel }) {
  const { createAccount, updateAccount } = useAccountStore();
  const isEdit = Boolean(account);
  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...account, access_token: '' } : EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async () => {
    setError(null); setSaving(true);
    try {
      const payload = {
        ...form,
        daily_limit: form.daily_limit ? Number(form.daily_limit) : null,
        department_id: form.department_id ? Number(form.department_id) : null,
      };
      if (isEdit) await updateAccount(account.id, payload);
      else await createAccount(payload);
      onSaved?.();
    } catch (e) {
      setError(e.response?.data?.message ?? 'تعذّر الحفظ. تحقّق من الحقول.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl bg-rose-500/10 text-rose-500 text-sm px-3.5 py-2.5">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="الاسم الداخلي" value={form.label} onChange={set('label')} placeholder="المبيعات" />
        <Field label="الرقم الظاهر" value={form.display_phone_number} onChange={set('display_phone_number')} placeholder="9665xxxxxxxx" ltr />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone Number ID" value={form.phone_number_id} onChange={set('phone_number_id')} placeholder="من Meta" ltr />
        <Field label="WABA ID" value={form.waba_id} onChange={set('waba_id')} placeholder="WhatsApp Business Account ID" ltr />
      </div>

      <div>
        <label className="label">Access Token {isEdit && <span className="text-muted font-normal">(اتركه فارغاً للإبقاء)</span>}</label>
        <input type="password" value={form.access_token} onChange={set('access_token')}
          placeholder={isEdit ? '••••••••' : 'Permanent Token'} className="input" dir="ltr" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Webhook Verify Token" value={form.webhook_verify_token} onChange={set('webhook_verify_token')} ltr />
        <Field label="الحد اليومي (اختياري)" type="number" value={form.daily_limit} onChange={set('daily_limit')} placeholder="1000" ltr />
      </div>

      <div>
        <label className="label">النشاط / القسم <span className="text-muted font-normal">(الرسائل الواردة لهذا الرقم تُوزَّع على موظفيه)</span></label>
        <select value={form.department_id ?? ''} onChange={set('department_id')} className="input">
          <option value="">بلا قسم (توزيع على كل المبيعات)</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-content">
        <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> الحساب مفعّل
      </label>

      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={saving} className="btn-primary flex-1">{saving ? 'جارِ الحفظ...' : 'حفظ'}</button>
        <button onClick={onCancel} className="btn-outline">إلغاء</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', ltr = false }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder} className="input" dir={ltr ? 'ltr' : undefined} />
    </div>
  );
}
