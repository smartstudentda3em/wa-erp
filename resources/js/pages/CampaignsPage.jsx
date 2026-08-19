import { useEffect, useState } from 'react';
import { Plus, X, Megaphone } from 'lucide-react';
import { useCampaignStore } from '../stores/campaignStore';
import { useCan } from '../hooks/useCan';
import CampaignForm from '../components/campaigns/CampaignForm';
import CampaignMonitor from '../components/campaigns/CampaignMonitor';

const STATUS = {
  draft: { label: 'مسودّة', cls: 'bg-slate-500/10 text-slate-400' },
  scheduled: { label: 'مجدولة', cls: 'bg-sky-500/10 text-sky-500' },
  queued: { label: 'بالانتظار', cls: 'bg-sky-500/10 text-sky-500' },
  processing: { label: 'قيد الإرسال', cls: 'bg-amber-500/10 text-amber-500' },
  paused: { label: 'متوقّفة', cls: 'bg-amber-500/10 text-amber-500' },
  completed: { label: 'مكتملة', cls: 'bg-emerald-500/10 text-emerald-500' },
  failed: { label: 'فاشلة', cls: 'bg-rose-500/10 text-rose-500' },
};

export default function CampaignsPage() {
  const { campaigns, loadCampaigns, loading } = useCampaignStore();
  const can = useCan();
  const canManage = can('campaigns.manage');
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:p-8 max-w-5xl mx-auto" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-content">الحملات</h1>
          {canManage && (
            <button onClick={() => setCreating((v) => !v)} className={creating ? 'btn-outline btn-sm' : 'btn-primary btn-sm'}>
              {creating ? <><X size={15} /> إغلاق</> : <><Plus size={16} /> حملة جديدة</>}
            </button>
          )}
        </div>

        {creating && <div className="mb-6"><CampaignForm onCreated={() => { setCreating(false); loadCampaigns(); }} /></div>}
        {activeId && <div className="mb-6"><CampaignMonitor campaignId={activeId} /></div>}

        <div className="card divide-y divide-line overflow-hidden">
          {loading && <p className="p-6 text-center text-muted text-sm">جارِ التحميل...</p>}
          {campaigns.map((c) => {
            const s = STATUS[c.status] ?? { label: c.status, cls: 'bg-slate-500/10 text-slate-400' };
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-start p-4 flex justify-between items-center gap-3 transition ${activeId === c.id ? 'bg-brand/5' : 'hover:bg-surface-2/50'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid place-items-center w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 shrink-0"><Megaphone size={18} /></div>
                  <div className="min-w-0">
                    <div className="font-semibold text-content truncate">{c.name}</div>
                    <div className="text-xs text-muted truncate">{c.template} · {c.stats.total} مستهدف</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  <span className="text-sm text-brand font-bold">{c.stats.progress}%</span>
                </div>
              </button>
            );
          })}
          {!loading && campaigns.length === 0 && <p className="p-8 text-center text-muted text-sm">لا توجد حملات بعد</p>}
        </div>
      </div>
    </div>
  );
}
