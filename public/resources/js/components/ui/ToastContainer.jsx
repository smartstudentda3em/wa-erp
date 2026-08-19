import { useToastStore } from '../../stores/toastStore';

const STYLES = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-sky-600',
  warning: 'bg-amber-600',
};

// حاوية الإشعارات — تُركّب مرّة واحدة في التخطيط الرئيسي
export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full max-w-sm px-4" dir="rtl">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`${STYLES[t.type] ?? STYLES.info} text-white rounded-xl shadow-lg px-4 py-3 text-sm
                     cursor-pointer flex items-center justify-between gap-3 animate-[fadeIn_.2s_ease-out]`}
        >
          <span>{t.message}</span>
          <span className="opacity-70 text-xs">✕</span>
        </div>
      ))}
    </div>
  );
}
