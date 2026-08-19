// Avatar بأحرف الاسم الأولى + تدرّج لوني ثابت مشتقّ من الاسم
const GRADS = [
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-red-500',
];

function initials(name = '') {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}

function hash(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const grad = GRADS[hash(name) % GRADS.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]'
    : size === 'lg' ? 'w-12 h-12 text-base'
    : 'w-10 h-10 text-[13px]';

  return (
    <div className={`shrink-0 grid place-items-center rounded-full text-white font-bold bg-gradient-to-br ${grad} ${sz} ${className}`}>
      {initials(name)}
    </div>
  );
}
