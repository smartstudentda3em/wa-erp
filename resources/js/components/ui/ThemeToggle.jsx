import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

const ICON = { system: Monitor, light: Sun, dark: Moon };
const LABEL = { system: 'حسب النظام', light: 'فاتح', dark: 'داكن' };

// زر تبديل الثيم (دائري): يدور بين حسب النظام → فاتح → داكن
export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const cycle = useThemeStore((s) => s.cycle);
  const Icon = ICON[theme] ?? Monitor;

  return (
    <button onClick={cycle} className="btn-icon" title={`الثيم: ${LABEL[theme]}`} aria-label="تبديل الثيم">
      <Icon size={18} />
    </button>
  );
}
