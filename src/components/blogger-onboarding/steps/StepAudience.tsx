import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionnaireData } from '../types';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const StepAudience = ({ data, onChange }: Props) => (
  <div className="space-y-4">
    <div>
      <Label>Пол аудитории: {data.audience_gender_male}% муж / {100 - data.audience_gender_male}% жен</Label>
      <Slider value={[data.audience_gender_male]} min={0} max={100} step={5}
        onValueChange={v => onChange({ audience_gender_male: v[0] })} className="mt-2" />
    </div>

    <div><Label>Основной возраст аудитории</Label>
      <Select value={data.audience_age} onValueChange={v => onChange({ audience_age: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="13-17">13–17</SelectItem>
          <SelectItem value="18-24">18–24</SelectItem>
          <SelectItem value="25-34">25–34</SelectItem>
          <SelectItem value="35-44">35–44</SelectItem>
          <SelectItem value="45+">45+</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div><Label>География аудитории</Label>
      <Input value={data.audience_geo} onChange={e => onChange({ audience_geo: e.target.value })}
        placeholder="Россия, СНГ..." />
    </div>

    <div><Label>Покупательская способность</Label>
      <Select value={data.purchasing_power} onValueChange={v => onChange({ purchasing_power: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="economy">Эконом</SelectItem>
          <SelectItem value="medium">Средний сегмент</SelectItem>
          <SelectItem value="above_medium">Выше среднего</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default StepAudience;
