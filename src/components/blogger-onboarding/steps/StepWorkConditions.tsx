import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionnaireData, NICHES } from '../types';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const StepWorkConditions = ({ data, onChange }: Props) => {
  const toggleCat = (cat: string) => {
    const next = data.excluded_categories.includes(cat)
      ? data.excluded_categories.filter(c => c !== cat)
      : [...data.excluded_categories, cat];
    onChange({ excluded_categories: next });
  };

  return (
    <div className="space-y-4">
      <div><Label>Скорость выполнения</Label>
        <Select value={String(data.speed_days || '')} onValueChange={v => onChange({ speed_days: Number(v) })}>
          <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 день ⚡</SelectItem>
            <SelectItem value="2">1–2 дня</SelectItem>
            <SelectItem value="3">2–3 дня</SelectItem>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="12">12 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Есть ПВЗ рядом</Label>
        <Switch checked={data.has_pvz_nearby} onCheckedChange={v => onChange({ has_pvz_nearby: v })} />
      </div>

      <div><Label>Как быстро забираете товар</Label>
        <Select value={data.pickup_speed} onValueChange={v => onChange({ pickup_speed: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="same_day">В день доставки</SelectItem>
            <SelectItem value="1-2_days">1–2 дня</SelectItem>
            <SelectItem value="3+_days">3+ дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Были ли срывы сроков</Label>
        <Switch checked={data.had_delays} onCheckedChange={v => onChange({ had_delays: v })} />
      </div>

      <div><Label>Какие категории НЕ берёте</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {NICHES.map(n => (
            <Badge key={n} variant={data.excluded_categories.includes(n) ? 'destructive' : 'outline'}
              className="cursor-pointer text-xs" onClick={() => toggleCat(n)}>{n}</Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Мин. цена товара ₽</Label>
          <Input type="number" value={data.min_product_price || ''} onChange={e => onChange({ min_product_price: Number(e.target.value) })} />
        </div>
        <div><Label className="text-xs">Макс. цена товара ₽</Label>
          <Input type="number" value={data.max_product_price || ''} onChange={e => onChange({ max_product_price: Number(e.target.value) })} />
        </div>
      </div>

      <div><Label>Товаров в месяц</Label>
        <Select value={data.products_per_month} onValueChange={v => onChange({ products_per_month: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1-2">1–2</SelectItem>
            <SelectItem value="3-5">3–5</SelectItem>
            <SelectItem value="5+">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div><Label>Активность</Label>
        <Select value={data.activity_level} onValueChange={v => onChange({ activity_level: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Активно ищу</SelectItem>
            <SelectItem value="moderate">Умеренно</SelectItem>
            <SelectItem value="rare">Редко</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div><Label>Условия сотрудничества</Label>
        <Select value={data.pricing_type} onValueChange={v => onChange({ pricing_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="barter">Только бартер</SelectItem>
            <SelectItem value="barter_paid">Бартер + доплата</SelectItem>
            <SelectItem value="custom">Своя цена</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data.pricing_type === 'barter_paid' || data.pricing_type === 'custom') && (
        <div><Label>Сумма, ₽</Label>
          <Input type="number" value={data.custom_price || ''} onChange={e => onChange({ custom_price: Number(e.target.value) })} />
        </div>
      )}
    </div>
  );
};

export default StepWorkConditions;
