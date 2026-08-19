// نقطة حالة متوهّجة (Glow Dot): أخضر=متاح (نبض حي)، كهرماني=بالخارج، رمادي=غير متصل
const COLOR = {
  available: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-slate-400',
};

export default function StatusDot({ status = 'offline', size = 'md', ring = true, className = '' }) {
  const color = COLOR[status] ?? COLOR.offline;
  const dot = size === 'lg' ? 'w-3 h-3' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const pulse = status === 'available';

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span className={`${dot} rounded-full ${color} ${ring ? 'ring-2 ring-surface' : ''}`} />
      {pulse && <span className={`absolute inset-0 rounded-full ${color} animate-pulse-ring`} />}
    </span>
  );
}
