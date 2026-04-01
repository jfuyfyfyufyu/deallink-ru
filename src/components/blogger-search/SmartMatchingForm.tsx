import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Star, Wand2 } from 'lucide-react';
import { getAutoWeights, DEFAULT_WEIGHTS, type PriorityWeights } from './recommendation-engine';
import type { MatchingParams, SearchGoal, SocialPlatform, SpeedFilter, PriceType } from './types';

const CATEGORIES = [
  'Красота', 'Еда', 'Фитнес', 'Мода', 'Технологии',
  'Путешествия', 'Лайфстайл', 'Дом и уют', 'Дети', 'Авто',
  'Здоровье', 'Аксессуары', 'Электроника', 'Финансы',
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];




const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'vk', label: 'VK' },
];

const SPEEDS: { id: SpeedFilter; label: string; desc: string }[] = [
  { id: 'fast', label: 'Быстро', desc: '1–3 дня' },
  { id: 'medium', label: 'Средне', desc: '4–7 дней' },
  { id: 'slow', label: 'Долго', desc: '7+ дней' },
];

const WEIGHT_LABELS: Record<keyof PriorityWeights, string> = {
  category: 'Ниша',
  geo: 'География',
  audience: 'Аудитория',
  reach: 'Охват',
  reliability: 'Надёжность',
  speed: 'Скорость',
  cooperation: 'Тип сотрудничества',
  family: 'Семейный контент',
};

interface Props {
  onSubmit: (params: MatchingParams) => void;
}

const SmartMatchingForm = ({ onSubmit }: Props) => {
  const [productUrl, setProductUrl] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [goals] = useState<SearchGoal[]>([]);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [minReach, setMinReach] = useState('');
  const [reachMode, setReachMode] = useState<'per_platform' | 'total'>('total');
  const [speed, setSpeed] = useState<SpeedFilter | null>(null);
  const [minRiskScore, setMinRiskScore] = useState(0);
  const [priceType, setPriceType] = useState<PriceType | null>(null);
  const [targetGender, setTargetGender] = useState<'male' | 'female' | 'unisex' | null>(null);
  const [targetAgeRange, setTargetAgeRange] = useState<string | null>(null);
  const [targetGeo, setTargetGeo] = useState('');
  const [familyRelevant, setFamilyRelevant] = useState(false);
  const [weights, setWeights] = useState<PriorityWeights>({ ...DEFAULT_WEIGHTS });
  const [showWeights, setShowWeights] = useState(false);




  const togglePlatform = (p: SocialPlatform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleAutoWeights = () => {
    setWeights(getAutoWeights(goals));
    setShowWeights(true);
  };

  const updateWeight = (key: keyof PriorityWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-1">
        <h3 className="text-lg font-bold">Умный подбор</h3>
        <p className="text-xs text-muted-foreground">Укажите параметры для точного подбора</p>
      </div>

      <div className="space-y-3">
        {/* Product URL */}
        <div>
          <Label className="text-xs">Ссылка на товар (WB / Ozon)</Label>
          <Input placeholder="https://wildberries.ru/catalog/..." value={productUrl} onChange={e => setProductUrl(e.target.value)} className="mt-1" />
        </div>

        {/* Category + Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Категория</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Выбрать" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Цена товара, ₽</Label>
            <Input type="number" placeholder="1500" value={price} onChange={e => setPrice(e.target.value)} className="mt-1" />
          </div>
        </div>

        {/* Target audience: gender + age */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Целевой пол</Label>
            <Select value={targetGender || ''} onValueChange={v => setTargetGender(v as any || null)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Любой" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unisex">Любой</SelectItem>
                <SelectItem value="female">Женский</SelectItem>
                <SelectItem value="male">Мужской</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Возраст ЦА</Label>
            <Select value={targetAgeRange || ''} onValueChange={v => setTargetAgeRange(v || null)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Любой" /></SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Geo */}
        <div>
          <Label className="text-xs">Целевая география</Label>
          <Input placeholder="Москва, Россия..." value={targetGeo} onChange={e => setTargetGeo(e.target.value)} className="mt-1" />
        </div>

        {/* Price type */}
        <div>
          <Label className="text-xs mb-1.5 block">Тип сотрудничества</Label>
          <div className="flex gap-2">
            {([
              { id: 'barter' as PriceType, label: 'Только бартер' },
              { id: 'paid' as PriceType, label: 'С доплатой' },
            ]).map(pt => (
              <button
                key={pt.id}
                onClick={() => setPriceType(prev => prev === pt.id ? null : pt.id)}
                className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                  priceType === pt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Family toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg border">
          <div>
            <p className="text-xs font-medium">Семейный товар</p>
            <p className="text-[10px] text-muted-foreground">Приоритет блогерам с детьми/партнёром</p>
          </div>
          <Switch checked={familyRelevant} onCheckedChange={setFamilyRelevant} />
        </div>

        {/* Platforms */}
        <div>
          <Label className="text-xs mb-1.5 block">Соц. сеть для рекламы</Label>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  platforms.includes(p.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reach */}
        <div>
          <Label className="text-xs mb-1.5 block">Минимальный охват (просмотры)</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="1000" value={minReach} onChange={e => setMinReach(e.target.value)} className="flex-1" />
            <Select value={reachMode} onValueChange={(v) => setReachMode(v as any)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Суммарно</SelectItem>
                <SelectItem value="per_platform">По каждой</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Speed */}
        <div>
          <Label className="text-xs mb-1.5 block">Скорость выполнения</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {SPEEDS.map(s => (
              <button
                key={s.id}
                onClick={() => setSpeed(prev => prev === s.id ? null : s.id)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  speed === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-xs font-medium">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Risk score */}
        <div>
          <Label className="text-xs mb-1.5 block">
            Минимальная надёжность {minRiskScore > 0 && <span className="text-primary ml-1">({minRiskScore}+ ★)</span>}
          </Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setMinRiskScore(prev => prev === star ? 0 : star)} className="p-1 transition-all">
                <Star className={`h-6 w-6 ${star <= minRiskScore ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
        </div>




        {/* Priority Weights */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Приоритеты (веса)</Label>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleAutoWeights}>
              <Wand2 className="h-3 w-3" />Автоподбор
            </Button>
          </div>

          {!showWeights ? (
            <button
              onClick={() => setShowWeights(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-2"
            >
              Настроить вручную ↓
            </button>
          ) : (
            <div className="space-y-2.5">
              {(Object.keys(WEIGHT_LABELS) as (keyof PriorityWeights)[]).map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-muted-foreground">{WEIGHT_LABELS[key]}</span>
                    <span className="text-[11px] font-medium w-4 text-right">{weights[key]}</span>
                  </div>
                  <Slider
                    value={[weights[key]]}
                    onValueChange={([v]) => updateWeight(key, v)}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={() => onSubmit({
        productUrl, category, price, goals, platforms, minReach, reachMode, speed, minRiskScore, priceType,
        targetGender, targetAgeRange, targetGeo: targetGeo || null, familyRelevant, weights,
      })}>
        Показать блогеров
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default SmartMatchingForm;
