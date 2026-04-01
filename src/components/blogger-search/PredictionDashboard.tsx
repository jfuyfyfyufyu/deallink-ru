import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, Video, ArrowRight } from 'lucide-react';
import type { EnrichedBlogger } from './types';

interface Props {
  bloggers: EnrichedBlogger[];
  onNext: () => void;
}

const PredictionDashboard = ({ bloggers, onNext }: Props) => {
  const available = bloggers.filter(b => b.stats.badge !== 'risk').length;
  const avgCompletion = bloggers.length > 0
    ? Math.round(bloggers.reduce((s, b) => s + b.stats.completionRate, 0) / bloggers.length)
    : 0;
  const avgDays = bloggers.length > 0
    ? Math.round(bloggers.reduce((s, b) => s + b.stats.avgDaysToReview, 0) / bloggers.length)
    : 7;
  const ugcCapable = bloggers.filter(b => b.stats.doesVideo || b.stats.doesPhoto).length;
  const minReviews = Math.round(available * avgCompletion / 100 * 0.7);
  const maxReviews = Math.round(available * avgCompletion / 100);

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h3 className="text-lg font-bold">Прогноз результата</h3>
        <p className="text-xs text-muted-foreground mt-1">На основе {bloggers.length} блогеров на платформе</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 text-center">
            <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">{minReviews}–{maxReviews}</p>
            <p className="text-[11px] text-muted-foreground">Прогноз отзывов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-accent-foreground mb-1" />
            <p className="text-2xl font-bold">{avgDays} дн.</p>
            <p className="text-[11px] text-muted-foreground">Средний срок</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{avgCompletion}%</p>
            <p className="text-[11px] text-muted-foreground">Выполнение</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Video className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{ugcCapable}</p>
            <p className="text-[11px] text-muted-foreground">UGC (видео/фото)</p>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full" size="lg" onClick={onNext}>
        Подобрать исполнителей
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default PredictionDashboard;
