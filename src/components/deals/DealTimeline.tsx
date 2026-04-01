import { HUMAN_STATUS } from './deal-utils';
import { formatDistanceToNow, differenceInHours, differenceInDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatusEntry {
  status: string;
  at: string;
}

interface Props {
  statusHistory: StatusEntry[];
  deadlinePickup?: string | null;
  deadlineContent?: string | null;
  deadlineReview?: string | null;
  currentStatus: string;
}

const DEADLINE_MAP: Record<string, { label: string; statuses: string[] }> = {
  deadlinePickup: { label: 'Забрать товар', statuses: ['approved', 'ordered', 'in_pvz'] },
  deadlineContent: { label: 'Отправить контент', statuses: ['picked_up', 'filming'] },
  deadlineReview: { label: 'Опубликовать', statuses: ['filming', 'review_posted'] },
};

const DealTimeline = ({ statusHistory, deadlinePickup, deadlineContent, deadlineReview, currentStatus }: Props) => {
  const entries = (statusHistory || []) as StatusEntry[];
  if (entries.length === 0) return null;

  const deadlines = { deadlinePickup, deadlineContent, deadlineReview };

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Хронология</p>
      <div className="relative pl-5">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />

        {entries.map((entry, i) => {
          const isLast = i === entries.length - 1;
          const humanStatus = HUMAN_STATUS[entry.status] || { emoji: '', label: entry.status };
          const date = new Date(entry.at);
          const prevDate = i > 0 ? new Date(entries[i - 1].at) : null;
          const elapsed = prevDate
            ? differenceInDays(date, prevDate) > 0
              ? `${differenceInDays(date, prevDate)} дн.`
              : `${differenceInHours(date, prevDate)} ч.`
            : null;

          return (
            <div key={i} className="relative flex items-start gap-2 pb-3 last:pb-0">
              <div className={`absolute left-[-13px] top-1 w-3 h-3 rounded-full border-2 ${
                isLast ? 'bg-primary border-primary' : 'bg-background border-primary/50'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{humanStatus.emoji} {humanStatus.label}</span>
                  {elapsed && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">+{elapsed}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {format(date, 'dd MMM yyyy, HH:mm', { locale: ru })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Active deadlines */}
        {Object.entries(DEADLINE_MAP).map(([key, { label, statuses }]) => {
          const deadline = deadlines[key as keyof typeof deadlines];
          if (!deadline || !statuses.includes(currentStatus)) return null;

          const deadlineDate = new Date(deadline);
          const now = new Date();
          const hoursLeft = differenceInHours(deadlineDate, now);
          const isOverdue = hoursLeft < 0;
          const isUrgent = hoursLeft >= 0 && hoursLeft <= 24;

          return (
            <div key={key} className="relative flex items-start gap-2 pb-3 last:pb-0">
              <div className={`absolute left-[-13px] top-1 w-3 h-3 rounded-full border-2 ${
                isOverdue ? 'bg-destructive border-destructive' : isUrgent ? 'bg-amber-500 border-amber-500' : 'bg-muted border-muted-foreground/30'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isOverdue ? (
                    <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                  ) : isUrgent ? (
                    <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                  ) : (
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${isOverdue ? 'text-destructive' : isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                <p className={`text-[10px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {isOverdue
                    ? `Просрочено на ${Math.abs(Math.ceil(hoursLeft / 24))} дн.`
                    : `до ${format(deadlineDate, 'dd MMM, HH:mm', { locale: ru })} (${formatDistanceToNow(deadlineDate, { locale: ru, addSuffix: false })})`
                  }
                </p>
              </div>
            </div>
          );
        })}

        {/* Total duration for finished deals */}
        {currentStatus === 'finished' && entries.length >= 2 && (() => {
          const totalDays = differenceInDays(new Date(entries[entries.length - 1].at), new Date(entries[0].at));
          return (
            <div className="relative flex items-start gap-2 pt-1">
              <div className="absolute left-[-13px] top-2 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary/40" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                <span className="text-xs text-primary font-medium">Итого: {totalDays} дн.</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default DealTimeline;
