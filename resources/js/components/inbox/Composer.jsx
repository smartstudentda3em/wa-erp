import { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { useInboxStore } from '../../stores/inboxStore';

export default function Composer() {
  const { sendText, sendMedia } = useInboxStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await sendText(text); setText(''); } finally { setSending(false); }
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSending(true);
      try { await sendMedia(file, ''); } finally { setSending(false); }
    }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 p-3 border-t border-line bg-surface shrink-0">
      <input type="file" ref={fileRef} onChange={onFile} hidden
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,video/*" />
      <button onClick={() => fileRef.current.click()} className="btn-icon" title="إرفاق ملف">
        <Paperclip size={20} />
      </button>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="اكتب رسالة..."
        className="flex-1 rounded-full border border-line bg-surface-2/60 px-4 py-2.5 text-sm text-content placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:bg-surface transition"
      />

      <button onClick={submit} disabled={sending || !text.trim()}
        className="grid place-items-center w-11 h-11 rounded-full text-white bg-gradient-to-l from-brand to-brand-2 shadow-lg shadow-brand/25 hover:shadow-xl hover:-translate-y-px active:translate-y-0 transition disabled:opacity-50 disabled:shadow-none disabled:translate-y-0">
        <Send size={18} style={{ transform: 'scaleX(-1)' }} />
      </button>
    </div>
  );
}
