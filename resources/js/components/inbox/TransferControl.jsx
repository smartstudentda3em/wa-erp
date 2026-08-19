import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useInboxStore } from '../../stores/inboxStore';
import Avatar from '../ui/Avatar';

// زر تحويل المحادثة لموظف آخر — لمن يملك صلاحية conversations.assign
export default function TransferControl() {
  const { agents, loadAgents, assignConversation } = useInboxStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { if (open && agents.length === 0) loadAgents(); }, [open]);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const transfer = async (userId) => { await assignConversation(userId); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="btn-outline btn-sm" title="تحويل لموظف آخر">
        <ArrowLeftRight size={15} /> تحويل
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-56 card shadow-pop p-1.5 z-20 max-h-64 overflow-y-auto animate-scale-in">
          {agents.length === 0 && <p className="p-3 text-xs text-muted text-center">جارِ التحميل...</p>}
          {agents.map((a) => (
            <button key={a.id} onClick={() => transfer(a.id)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-start hover:bg-surface-2 transition">
              <Avatar name={a.name} size="sm" />
              <span className="truncate text-content">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
