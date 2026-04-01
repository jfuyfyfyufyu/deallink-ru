import { Button } from '@/components/ui/button';
import { FileText, Zap, Video, ShieldCheck } from 'lucide-react';
import type { QuickFilter } from './types';

interface Props {
  active: QuickFilter | null;
  onChange: (f: QuickFilter | null) => void;
}

const filters: { id: QuickFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'reviews', label: 'Отзывы', icon: <FileText className="h-3 w-3" /> },
  { id: 'fast', label: 'Быстро', icon: <Zap className="h-3 w-3" /> },
  { id: 'ugc', label: 'UGC', icon: <Video className="h-3 w-3" /> },
  { id: 'reliable', label: 'Надёжные', icon: <ShieldCheck className="h-3 w-3" /> },
];

const QuickFilters = ({ active, onChange }: Props) => (
  <div className="flex gap-1.5 overflow-x-auto pb-1">
    {filters.map(f => (
      <Button
        key={f.id}
        size="sm"
        variant={active === f.id ? 'default' : 'outline'}
        className="h-7 text-xs gap-1 shrink-0"
        onClick={() => onChange(active === f.id ? null : f.id)}
      >
        {f.icon}{f.label}
      </Button>
    ))}
  </div>
);

export default QuickFilters;
