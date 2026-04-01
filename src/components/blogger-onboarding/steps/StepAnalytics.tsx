import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionnaireData, CONTENT_TYPES, CONTENT_STYLES } from '../types';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const StepAnalytics = ({ data, onChange }: Props) => {
  const toggleArr = (arr: string[], item: string, key: keyof QuestionnaireData) => {
    const next = arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
    onChange({ [key]: next } as any);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Средние просмотры за 7 дней</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Shorts</Label>
          <Input type="number" value={data.avg_shorts_views || ''} onChange={e => onChange({ avg_shorts_views: Number(e.target.value) })} />
        </div>
        <div><Label className="text-xs">Reels</Label>
          <Input type="number" value={data.avg_reels_views || ''} onChange={e => onChange({ avg_reels_views: Number(e.target.value) })} />
        </div>
        <div><Label className="text-xs">Stories</Label>
          <Input type="number" value={data.avg_stories_views || ''} onChange={e => onChange({ avg_stories_views: Number(e.target.value) })} />
        </div>
        <div><Label className="text-xs">Видео (общие)</Label>
          <Input type="number" value={data.avg_video_views || ''} onChange={e => onChange({ avg_video_views: Number(e.target.value) })} />
        </div>
      </div>

      <div><Label className="text-xs">Посты (Telegram/VK)</Label>
        <Input type="number" value={data.avg_post_views || ''} onChange={e => onChange({ avg_post_views: Number(e.target.value) })} />
      </div>

      <div><Label>Лучший ролик (ссылка)</Label>
        <Input value={data.best_video_url} onChange={e => onChange({ best_video_url: e.target.value })} placeholder="https://..." />
      </div>

      <div><Label>Динамика просмотров</Label>
        <Select value={data.views_trend} onValueChange={v => onChange({ views_trend: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="growing">📈 Рост</SelectItem>
            <SelectItem value="stable">➡️ Стабильно</SelectItem>
            <SelectItem value="declining">📉 Падение</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Делаю видео</Label>
        <Switch checked={data.does_video} onCheckedChange={v => onChange({ does_video: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Делаю фото</Label>
        <Switch checked={data.does_photo} onCheckedChange={v => onChange({ does_photo: v })} />
      </div>

      <div><Label>Instagram формат</Label>
        <Select value={data.instagram_format} onValueChange={v => onChange({ instagram_format: v })}>
          <SelectTrigger><SelectValue placeholder="Не использую" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="stories">Только Stories</SelectItem>
            <SelectItem value="reels">Только Reels</SelectItem>
            <SelectItem value="both">Reels + Stories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div><Label>Тип контента</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CONTENT_TYPES.map(t => (
            <Badge key={t} variant={data.content_types.includes(t) ? 'default' : 'outline'}
              className="cursor-pointer" onClick={() => toggleArr(data.content_types, t, 'content_types')}>{t}</Badge>
          ))}
        </div>
      </div>

      <div><Label>Стиль контента</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CONTENT_STYLES.map(s => (
            <Badge key={s} variant={data.content_style.includes(s) ? 'default' : 'outline'}
              className="cursor-pointer" onClick={() => toggleArr(data.content_style, s, 'content_style')}>{s}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepAnalytics;
