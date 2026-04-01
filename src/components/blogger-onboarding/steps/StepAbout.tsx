import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Star } from 'lucide-react';
import { QuestionnaireData } from '../types';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const MOTIVATIONS = ['Получать продукт бесплатно', 'Заработок', 'Развитие блога'];

const RatingRow = ({ label, value, onSet }: { label: string; value: number; onSet: (v: number) => void }) => (
  <div className="flex items-center justify-between">
    <Label className="text-sm">{label}</Label>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-5 w-5 cursor-pointer ${i <= value ? 'text-accent fill-accent' : 'text-muted'}`}
          onClick={() => onSet(i)} />
      ))}
    </div>
  </div>
);

const StepAbout = ({ data, onChange }: Props) => {
  const toggleMotivation = (m: string) => {
    const next = data.motivation.includes(m) ? data.motivation.filter(x => x !== m) : [...data.motivation, m];
    onChange({ motivation: next });
  };

  return (
    <div className="space-y-4">
      <div><Label>Мотивация (можно несколько)</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {MOTIVATIONS.map(m => (
            <Badge key={m} variant={data.motivation.includes(m) ? 'default' : 'outline'}
              className="cursor-pointer" onClick={() => toggleMotivation(m)}>{m}</Badge>
          ))}
        </div>
      </div>

      <div><Label>Стиль работы</Label>
        <Select value={data.work_style} onValueChange={v => onChange({ work_style: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fast">Быстро и просто</SelectItem>
            <SelectItem value="quality">Качественно, но дольше</SelectItem>
            <SelectItem value="balance">Баланс</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Есть дети</Label>
        <Switch checked={data.has_children} onCheckedChange={v => onChange({ has_children: v })} />
      </div>
      {data.has_children && (
        <div><Label className="text-xs">Возраст детей</Label>
          <Input value={data.children_ages} onChange={e => onChange({ children_ages: e.target.value })} placeholder="3, 7" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Есть партнёр</Label>
        <Switch checked={data.has_partner} onCheckedChange={v => onChange({ has_partner: v })} />
      </div>

      <p className="text-sm font-medium pt-2">Самооценка</p>
      <RatingRow label="Надёжность" value={data.self_reliability} onSet={v => onChange({ self_reliability: v })} />
      <RatingRow label="Скорость" value={data.self_speed} onSet={v => onChange({ self_speed: v })} />
      <RatingRow label="Качество контента" value={data.self_quality} onSet={v => onChange({ self_quality: v })} />
    </div>
  );
};

export default StepAbout;
