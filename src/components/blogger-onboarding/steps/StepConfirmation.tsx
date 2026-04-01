import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { QuestionnaireData } from '../types';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const StepConfirmation = ({ data, onChange }: Props) => (
  <div className="space-y-4">
    <div><Label>Тестовое задание: напишите пример отзыва на товар</Label>
      <Textarea value={data.sample_review} onChange={e => onChange({ sample_review: e.target.value })}
        placeholder="Представьте, что вам прислали крем для рук. Напишите отзыв как для WB..."
        className="min-h-[100px]" />
    </div>

    <div><Label>Ссылки на видео-примеры (каждая с новой строки)</Label>
      <Textarea value={data.portfolio_videos.join('\n')}
        onChange={e => onChange({ portfolio_videos: e.target.value.split('\n').filter(Boolean) })}
        placeholder="https://youtube.com/shorts/...&#10;https://tiktok.com/@..."
        className="min-h-[80px]" />
    </div>

    <div><Label>Расскажите о себе и своих фишках</Label>
      <Textarea value={data.additional_info} onChange={e => onChange({ additional_info: e.target.value })}
        placeholder="Что вас отличает от других блогеров?" />
    </div>

    <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-2">
      <p className="text-sm font-medium">Обязательство</p>
      <p className="text-xs text-muted-foreground">Я обязуюсь:</p>
      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
        <li>Выполнять условия сделок</li>
        <li>Не срывать сроки</li>
        <li>Соблюдать договорённости с селлерами</li>
      </ul>
      <div className="flex items-center gap-2 pt-2">
        <Checkbox checked={data.agreement_accepted}
          onCheckedChange={v => onChange({ agreement_accepted: !!v })} id="agree" />
        <label htmlFor="agree" className="text-sm cursor-pointer">Подтверждаю</label>
      </div>
    </div>
  </div>
);

export default StepConfirmation;
