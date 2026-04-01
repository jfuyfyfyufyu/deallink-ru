import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Calculator } from 'lucide-react';
import type { EnrichedBlogger } from './types';

interface Props {
  bloggers: EnrichedBlogger[];
  selected: string[];
  onAutoSelect: (count: number) => void;
  onLaunch: () => void;
  launching: boolean;
}

const BatchPanel = ({ bloggers, selected, onAutoSelect, onLaunch, launching }: Props) => {
  const [targetReviews, setTargetReviews] = useState('');

  const available = bloggers.filter(b => b.stats.badge !== 'risk');
  const avgCompletion = available.length > 0
    ? available.reduce((s, b) => s + b.stats.completionRate, 0) / available.length / 100
    : 0.7;
  const avgDays = available.length > 0
    ? Math.round(available.reduce((s, b) => s + b.stats.avgDaysToReview, 0) / available.length)
    : 7;

  const target = Number(targetReviews) || 0;
  const neededBloggers = target > 0 ? Math.ceil(target / Math.max(avgCompletion, 0.3)) : 0;
  const probability = target > 0 && neededBloggers <= available.length
    ? Math.min(95, Math.round(avgCompletion * 100))
    : target > 0 ? Math.round((available.length / neededBloggers) * avgCompletion * 100) : 0;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <p className="font-semibold text-sm">Собрать пакет</p>
        </div>

        <div>
          <Label className="text-xs">Сколько отзывов нужно?</Label>
          <Input
            type="number"
            placeholder="20"
            value={targetReviews}
            onChange={e => setTargetReviews(e.target.value)}
            className="mt-1"
          />
        </div>

        {target > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-md p-2">
              <p className="text-lg font-bold">{neededBloggers}</p>
              <p className="text-[10px] text-muted-foreground">Блогеров</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2">
              <p className="text-lg font-bold">{avgDays} дн.</p>
              <p className="text-[10px] text-muted-foreground">Срок</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2">
              <p className="text-lg font-bold">{probability}%</p>
              <p className="text-[10px] text-muted-foreground">Вероятность</p>
            </div>
          </div>
        )}

        {target > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onAutoSelect(neededBloggers)}
          >
            Автоподбор {neededBloggers} блогеров
          </Button>
        )}

        {selected.length > 0 && (
          <Button className="w-full gap-2" onClick={onLaunch} disabled={launching}>
            <Rocket className="h-4 w-4" />
            {launching ? 'Запуск...' : `Запустить массово (${selected.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchPanel;
