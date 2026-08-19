import { useEffect, useState } from 'react';
import { Plus, Package, History } from 'lucide-react';
import api from '../../lib/axios';
import { useInboxStore } from '../../stores/inboxStore';
import Avatar from '../ui/Avatar';

// العمود الجانبي: ملف العميل + الطلبات + سجل التفاعلات
export default function CustomerPanel() {
  const { activeId, conversations } = useInboxStore();
  const conv = conversations.find((c) => c.id === activeId);
  const customerId = conv?.customer?.id;
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    setCustomer(null);
    api.get(`/customers/${customerId}`).then(({ data }) => setCustomer(data.data));
  }, [customerId]);

  if (!customer) return <div className="p-6 text-muted text-sm text-center">جارِ التحميل...</div>;

  return (
    <div className="p-4 space-y-5" dir="rtl">
      {/* البطاقة التعريفية */}
      <section className="card p-5 text-center">
        <Avatar name={customer.name} size="lg" className="mx-auto !w-16 !h-16 !text-xl" />
        <h3 className="font-bold text-content mt-3">{customer.name}</h3>
        <p className="text-sm text-muted" dir="ltr">{customer.phone}</p>
        {customer.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {customer.tags.map((t) => (
              <span key={t} className="badge bg-surface-2 text-muted">{t}</span>
            ))}
          </div>
        )}
      </section>

      {/* الطلبات */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-content flex items-center gap-1.5"><Package size={15} /> الطلبات</h4>
          <NewOrderButton customerId={customer.id} conversationId={activeId} />
        </div>
        <div className="space-y-1.5">
          {customer.orders?.length ? customer.orders.map((o) => (
            <div key={o.id} className="card px-3 py-2 flex justify-between items-center text-sm">
              <span className="text-content font-medium">{o.order_number}</span>
              <span className="text-muted">{o.total_amount} {o.currency}</span>
            </div>
          )) : <p className="text-xs text-muted">لا توجد طلبات</p>}
        </div>
      </section>

      {/* سجل التفاعلات */}
      <section>
        <h4 className="text-sm font-bold text-content mb-2 flex items-center gap-1.5"><History size={15} /> سجل التفاعلات</h4>
        <ul className="space-y-2">
          {customer.interactions?.length ? customer.interactions.map((i, idx) => (
            <li key={idx} className="text-xs text-muted border-e-2 border-line pe-3">{i.description}</li>
          )) : <p className="text-xs text-muted">لا يوجد سجل بعد</p>}
        </ul>
      </section>
    </div>
  );
}

function NewOrderButton({ customerId, conversationId }) {
  const create = async () => {
    const name = prompt('اسم المنتج؟');
    if (!name) return;
    const qty = Number(prompt('الكمية؟', '1')) || 1;
    const price = Number(prompt('سعر الوحدة؟', '0')) || 0;

    await api.post('/orders', {
      customer_id: customerId,
      conversation_id: conversationId,
      items: [{ product_name: name, quantity: qty, unit_price: price }],
    });
    alert('تم إنشاء الطلب');
  };

  return (
    <button onClick={create} className="btn-soft btn-sm">
      <Plus size={14} /> طلب
    </button>
  );
}
