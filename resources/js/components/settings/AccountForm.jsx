import { useState } from 'react';
import { useAccountStore } from '../../stores/accountStore';

const EMPTY = {
  label: '',
  display_phone_number: '',
  phone_number_id: '',
  waba_id: '',
  access_token: '',
  webhook_verify_token: '',
  daily_limit: '',
  is_active: true,
};

// نموذج إضافة/تعديل حساب واتساب. عند التعديل: اترك التوكن فارغاً للإبقاء عليه.
export default function AccountForm({ account, onSaved, onCancel }) {
  const { createAccount, updateAccount } = useAccountStore();
  const isEdit = Boolean(account);
  const [form, setForm] = useState(
    isEdit ? { ...EMPTY, ...account, access_token: '' } : EMPTY
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        daily_limit: form.daily_limit ? Number(form.daily_limit) : null,
      };
      if (isEdit) await updateAccount(account.id, payload);
      else await createAccount(payload);
      onSaved?.();
    } catch (e) {
      setError(e.response?.data?.message ?? 'تعذّر الحفظ. تحقّق من الحقول.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-xl" dir="rtl">
      <h3 className="font-bold">{isEdit ? 'تعديل حساب' : 'إضافة حساب واتساب'}</h3>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2">{error}</div>}

      <Field label="الاسم الداخلي" value={form.label} onChange={set('label')} placeholder="المبيعات" />
      <Field label="الرقم الظاهر" value={form.display_phone_number} onChange={set('display_phone_number')} placeholder="+9665xxxxxxxx" />
      <Field label="Phone Number ID" value={form.phone_number_id} onChange={set('phone_number_id')} placeholder="من Meta" />
      <Field label="WABA ID" value={form.waba_id} onChange={set('waba_id')} placeholder="WhatsApp Business Account ID" />

      <div>
        <label className="block text-sm font-medium mb-1">
          Access Token {isEdit && <span className="text-xs text-gray-400">(اتركه فارغاً للإبقاء على الحالي)</span>}
        </label>
        <input
          type="password"
          value={form.access_token}
          onChange={set('access_token')}
          placeholder={isEdit ? '••••••••' : 'Permanent Token'}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <Field label="Webhook Verify Token" value={form.webhook_verify_token} onChange={set('webhook_verify_token')} />
      <Field label="الحد اليومي (اختياري)" type="number" value={form.daily_limit} onChange={set('daily_limit')} placeholder="1000" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
        الحساب مفعّل
      </label>

      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={saving}
          className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 disabled:opacity-50">
          {saving ? 'جارِ الحفظ...' : 'حفظ'}
        </button>
        <button onClick={onCancel} className="border rounded-lg px-4 py-2 hover:bg-gray-50">إلغاء</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}
