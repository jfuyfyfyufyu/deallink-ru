import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QuestionnaireData, PLATFORMS } from '../types';
import { useState } from 'react';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
}

const StepSocials = ({ data, onChange }: Props) => {
  const [active, setActive] = useState<string[]>(Object.keys(data.social_platforms));

  const toggle = (key: string) => {
    const next = active.includes(key) ? active.filter(k => k !== key) : [...active, key];
    setActive(next);
    if (!next.includes(key)) {
      const platforms = { ...data.social_platforms };
      delete platforms[key];
      onChange({ social_platforms: platforms });
    } else {
      onChange({
        social_platforms: {
          ...data.social_platforms,
          [key]: { url: '', subscribers: 0, avg_views: 0 },
        },
      });
    }
  };

  const update = (key: string, field: string, value: string | number) => {
    onChange({
      social_platforms: {
        ...data.social_platforms,
        [key]: { ...data.social_platforms[key], [field]: value },
      },
    });
  };

  return (
    <div className="space-y-4">
      <Label>Выберите ваши платформы</Label>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(p => (
          <Badge key={p.key} variant={active.includes(p.key) ? 'default' : 'outline'}
            className="cursor-pointer text-sm px-3 py-1" onClick={() => toggle(p.key)}>
            {p.label}
          </Badge>
        ))}
      </div>

      {active.map(key => {
        const pl = PLATFORMS.find(p => p.key === key);
        const val = data.social_platforms[key] || { url: '', subscribers: 0, avg_views: 0 };
        return (
          <div key={key} className="rounded-lg border border-border p-3 space-y-2">
            <p className="font-medium text-sm">{pl?.label}</p>
            <Input placeholder="Ссылка на профиль" value={val.url}
              onChange={e => update(key, 'url', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Подписчики</Label>
                <Input type="number" value={val.subscribers || ''} placeholder="10000"
                  onChange={e => update(key, 'subscribers', Number(e.target.value))} />
              </div>
              <div><Label className="text-xs">Средние просмотры</Label>
                <Input type="number" value={val.avg_views || ''} placeholder="5000"
                  onChange={e => update(key, 'avg_views', Number(e.target.value))} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepSocials;
