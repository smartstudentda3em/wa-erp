import { useEffect, useState } from 'react';
import { echo } from '../../echo';

// شريط تقدّم الحملة اللحظي عبر Reverb
export default function CampaignMonitor({ campaignId, initial }) {
  const [stats, setStats] = useState(initial ?? {
    status: 'processing', total: 0, sent: 0, delivered: 0, read: 0, failed: 0, progress: 0,
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const channel = echo.private(`campaign.${campaignId}`);
    channel.listen('.campaign.progress', (e) => setStats(e));
    channel.listen('.campaign.limit_reached', (e) => setAlert(e.message));
    return () => echo.leave(`campaign.${campaignId}`);
  }, [campaignId]);

  return (
    <div className="p-4 bg-white rounded-xl shadow" dir="rtl">
      <div className="flex justify-between mb-2">
        <span className="font-medium">تقدّم الحملة</span>
        <span className="text-sm text-gray-500">{stats.progress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-green-500 h-3 transition-all duration-500"
          style={{ width: `${stats.progress}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
        <Stat label="مُرسَل" value={stats.sent} color="text-gray-700" />
        <Stat label="مُستلَم" value={stats.delivered} color="text-blue-600" />
        <Stat label="مقروء" value={stats.read} color="text-sky-500" />
        <Stat label="فاشل" value={stats.failed} color="text-red-500" />
      </div>

      {alert && (
        <p className="text-amber-700 bg-amber-50 rounded-lg p-2 text-sm mt-3 text-center">⚠️ {alert}</p>
      )}
      {stats.status === 'completed' && (
        <p className="text-green-600 text-sm mt-3 text-center">✅ اكتملت الحملة</p>
      )}
      {stats.status === 'paused' && !alert && (
        <p className="text-amber-600 text-sm mt-3 text-center">⏸️ الحملة متوقّفة</p>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
