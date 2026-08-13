import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useInboxStore } from '../../stores/inboxStore';

// العمود الجانبي: ملف العميل + سجل التفاعلات + الطلبات + إنشاء طلب
export default function CustomerPanel() {
  const { activeId, conversations } = useInboxStore();
  const conv = conversations.find((c) => c.id === activeId);
  const customerId = conv?.customer?.id;
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    api.get(`/customers/${customerId}`).then(({ data }) => setCustomer(data.data));
  }, [customerId]);

  if (!customer) return <div className="p-4 text-gray-400 text-sm">جارِ التحميل...</div>;

  return (
    <div className="p-4 space-y-5" dir="rtl">
      <section>
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold mx-auto">
          {customer.name?.charAt(0)}
        </div>
        <h3 className="text-center font-semibold mt-2">{customer.name}</h3>
        <p className="text-center text-sm text-gray-500">{customer.phone}</p>
        {customer.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {customer.tags.map((t) => (
              <span key={t} className="text-[11px] bg-gray-100 rounded-full px-2 py-0.5">{t}</span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold mb-2 flex justify-between items-center">
          الطلبات
          <NewOrderButton customerId={customer.id} conversationId={activeId} />
        </h4>
        <div className="space-y-1">
          {customer.orders?.length ? customer.orders.map((o) => (
            <div key={o.id} className="text-xs border rounded-lg p-2 flex justify-between">
              <span>{o.order_number}</span>
              <span className="text-gray-500">{o.total_amount} {o.currency}</span>
            </div>
          )) : <p className="text-xs text-gray-400">لا توجد طلبات</p>}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold mb-2">سجل التفاعلات</h4>
        <ul className="space-y-1">
          {customer.interactions?.map((i, idx) => (
            <li key={idx} className="text-xs text-gray-600 border-r-2 border-gray-200 pr-2">
              {i.description}
            </li>
          ))}
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
    <button onClick={create} className="text-[11px] text-green-600 hover:underline">
      + إنشاء طلب
    </button>
  );
}
