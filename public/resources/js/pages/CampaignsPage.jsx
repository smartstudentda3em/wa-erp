import { useEffect, useState } from 'react';
import { useCampaignStore } from '../stores/campaignStore';
import { useCan } from '../hooks/useCan';
import CampaignForm from '../components/campaigns/CampaignForm';
import CampaignMonitor from '../components/campaigns/CampaignMonitor';

const STATUS_LABELS = {
  draft: 'مسودّة', scheduled: 'مجدولة', queued: 'بالانتظار',
  processing: 'قيد الإرسال', paused: 'متوقّفة', completed: 'مكتملة', failed: 'فاشلة',
};

export default function CampaignsPage() {
  const { campaigns, loadCampaigns, loading } = useCampaignStore();
  const can = useCan();
  const canManage = can('campaigns.manage');
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">الحملات</h1>
        {/* إنشاء الحملات: admin/manager فقط */}
        {canManage && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600"
          >
            {creating ? 'إغلاق' : '+ حملة جديدة'}
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-6">
          <CampaignForm onCreated={() => { setCreating(false); loadCampaigns(); }} />
        </div>
      )}

      {activeId && (
        <div className="mb-6">
          <CampaignMonitor campaignId={activeId} />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow divide-y">
        {loading && <p className="p-4 text-center text-gray-400 text-sm">جارِ التحميل...</p>}
        {campaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`w-full text-right p-4 hover:bg-gray-50 flex justify-between items-center
              ${activeId === c.id ? 'bg-green-50' : ''}`}
          >
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-400">
                {c.template} · {c.stats.total} مستهدف
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-gray-100 rounded-full px-3 py-1">
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
              <span className="text-sm text-green-700 font-semibold">{c.stats.progress}%</span>
            </div>
          </button>
        ))}
        {!loading && campaigns.length === 0 && (
          <p className="p-4 text-center text-gray-400 text-sm">لا توجد حملات بعد</p>
        )}
      </div>
    </div>
  );
}
