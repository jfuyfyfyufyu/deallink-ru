import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { QuestionnaireData } from '../types';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const MARKETPLACES = ['Wildberries', 'Ozon'];

const StepExperience = ({ data, onChange }: Props) => {
  const toggleMp = (mp: string) => {
    const next = data.worked_marketplaces.includes(mp)
      ? data.worked_marketplaces.filter(m => m !== mp)
      : [...data.worked_marketplaces, mp];
    onChange({ worked_marketplaces: next });
  };

  return (
    <div className="space-y-4">
      <div><Label>Количество бартерных сделок</Label>
        <Select value={data.deals_experience} onValueChange={v => onChange({ deals_experience: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0-5">0–5 (новичок)</SelectItem>
            <SelectItem value="5-20">5–20 (опытный)</SelectItem>
            <SelectItem value="20+">20+ (профи)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div><Label>Работал с маркетплейсами</Label>
        <div className="flex gap-2 mt-1">
          {MARKETPLACES.map(mp => (
            <Badge key={mp} variant={data.worked_marketplaces.includes(mp) ? 'default' : 'outline'}
              className="cursor-pointer" onClick={() => toggleMp(mp)}>{mp}</Badge>
          ))}
        </div>
      </div>

      <div><Label>Результаты (переходы, заказы)</Label>
        <Textarea value={data.experience_results} onChange={e => onChange({ experience_results: e.target.value })}
          placeholder="Расскажите о своих результатах..." />
      </div>

      <p className="text-sm font-medium pt-2">Готовность к задачам</p>
      {[
        { key: 'ready_to_buy' as const, label: 'Выкупать товар' },
        { key: 'ready_for_tz' as const, label: 'Работать по ТЗ' },
        { key: 'ready_for_wb_review' as const, label: 'Оставлять отзыв на WB' },
        { key: 'ready_for_photo_review' as const, label: 'Прикреплять фото к отзыву' },
        { key: 'ready_for_video_review' as const, label: 'Снимать видео-отзыв' },
        { key: 'ready_for_shorts' as const, label: 'Делать Reels / Shorts' },
      ].map(item => (
        <div key={item.key} className="flex items-center justify-between">
          <Label className="text-sm">{item.label}</Label>
          <Switch checked={data[item.key]} onCheckedChange={v => onChange({ [item.key]: v })} />
        </div>
      ))}

      <div><Label>Тип отзывов</Label>
        <Select value={data.review_type} onValueChange={v => onChange({ review_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Только текст</SelectItem>
            <SelectItem value="text_photo">Текст + фото</SelectItem>
            <SelectItem value="text_video">Текст + видео</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StepExperience;
