import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface DealDeadlineProps {
  status: string;
  deadlinePickup?: string | null;
  deadlineContent?: string | null;
  deadlineReview?: string | null;
}

const getRelevantDeadline = (status: string, props: DealDeadlineProps): { label: string; deadline: string } | null => {
  if (['approved', 'ordered', 'in_pvz'].includes(status) && props.deadlinePickup) {
    return { label: 'Забрать до', deadline: props.deadlinePickup };
  }
  if (['picked_up', 'filming'].includes(status) && props.deadlineContent) {
    return { label: 'Контент до', deadline: props.deadlineContent };
  }
  if (['filming', 'review_posted'].includes(status) && props.deadlineReview) {
    return { label: 'Отзыв до', deadline: props.deadlineReview };
  }
  return null;
};

const DealDeadlineBadge = (props: DealDeadlineProps) => {
  const info = getRelevantDeadline(props.status, props);
  if (!info) return null;

  const deadline = new Date(info.deadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 1;

  const dateStr = deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  if (isOverdue) {
    return (
      <Badge variant="destructive" className="text-[10px] gap-1">
        <AlertTriangle className="h-3 w-3" />
        Просрочено на {Math.abs(diffDays)} дн.
      </Badge>
    );
  }

  if (isUrgent) {
    return (
      <Badge className="bg-accent/20 text-accent-foreground text-[10px] gap-1">
        <Clock className="h-3 w-3" />
        {info.label}: {dateStr} (осталось {diffDays === 0 ? 'сегодня' : '1 день'})
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      {info.label}: {dateStr} ({diffDays} дн.)
    </Badge>
  );
};

export default DealDeadlineBadge;
