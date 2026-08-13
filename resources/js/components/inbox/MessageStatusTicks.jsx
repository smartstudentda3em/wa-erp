// علامات التوثيق الملوّنة: pending 🕐 | sent ✓ | delivered ✓✓ | read ✓✓ أزرق | failed ✗
export default function MessageStatusTicks({ status }) {
  if (status === 'pending') {
    return <ClockIcon className="w-3.5 h-3.5 text-gray-400" />;
  }
  if (status === 'failed') {
    return <span className="text-red-500 text-[11px]">✗ فشل</span>;
  }

  const isRead = status === 'read';
  const single = status === 'sent';

  return (
    <span className={`inline-flex items-center ${isRead ? 'text-sky-500' : 'text-gray-400'}`}>
      <CheckIcon className="w-3.5 h-3.5" />
      {!single && <CheckIcon className="w-3.5 h-3.5 -mr-2" />}
    </span>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
