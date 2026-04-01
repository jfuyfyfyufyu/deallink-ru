import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Star, Users, Eye, Baby, Heart, MapPin, ShieldCheck, Zap, Award, Video, Camera, ExternalLink, Clock, CheckCircle, AlertTriangle, MessageCircle, TrendingUp } from 'lucide-react';
import type { EnrichedBlogger } from './types';

interface Props {
  blogger: EnrichedBlogger | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StarRating = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} className={`h-3.5 w-3.5 ${i < value ? 'text-accent fill-accent' : 'text-muted'}`} />
    ))}
  </div>
);

const InfoBlock = ({ icon: Icon, label, value, iconClass }: { icon: any; label: string; value: string | number; iconClass?: string }) => (
  <div className="flex items-center gap-2 py-1.5">
    <Icon className={`h-4 w-4 shrink-0 ${iconClass || 'text-muted-foreground'}`} />
    <span className="text-sm text-muted-foreground">{label}:</span>
    <span className="text-sm font-medium ml-auto">{value}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </div>
);

const BloggerDetailModal = ({ blogger, open, onOpenChange }: Props) => {
  if (!blogger) return null;
  const { stats, questionnaire: q } = blogger;

  const purchasingLabels: Record<string, string> = {
    economy: 'Эконом', medium: 'Средний', above_medium: 'Выше среднего',
  };
  const workStyleLabels: Record<string, string> = {
    fast: 'Быстро и просто', quality: 'Качественно, но дольше', balance: 'Баланс',
  };
  const speedLabels: Record<string, string> = {
    fast: 'Быстрая', medium: 'Средняя', slow: 'Медленная',
  };

  // Build platform links
  const platformLinks: { label: string; url: string }[] = [];
  if (blogger.platforms && typeof blogger.platforms === 'object') {
    const p = blogger.platforms as Record<string, any>;
    const getUrl = (val: any): string => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && typeof val.url === 'string') return val.url;
      return '';
    };
    Object.entries(p).forEach(([key, val]) => {
      const url = getUrl(val);
      if (url) platformLinks.push({ label: key.charAt(0).toUpperCase() + key.slice(1), url });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="sr-only">Профиль блогера</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={blogger.avatar_url || ''} />
            <AvatarFallback>{blogger.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{q?.full_name || blogger.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {q?.age && <span>{q.age} лет</span>}
              {q?.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{q.city}{q.country ? `, ${q.country}` : ''}</span>}
            </div>
            {blogger.niche && <Badge variant="outline" className="text-[10px] mt-1">{blogger.niche}</Badge>}
          </div>
        </div>

        {q?.additional_info && (
          <p className="text-xs text-muted-foreground italic">{q.additional_info}</p>
        )}

        <Separator />

        {/* Indices */}
        {q && (
          <Section title="Индексы блогера">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Надёжность', value: q.reliability_index, icon: ShieldCheck, color: 'text-green-500' },
                { label: 'Скорость', value: q.speed_index, icon: Zap, color: 'text-blue-500' },
                { label: 'Качество', value: q.quality_index, icon: Award, color: 'text-purple-500' },
                { label: 'Дисциплина', value: q.discipline_index, icon: CheckCircle, color: 'text-amber-500' },
              ].map(idx => (
                <div key={idx.label} className="bg-muted/50 rounded-lg p-2 text-center">
                  <idx.icon className={`h-4 w-4 mx-auto mb-1 ${idx.color}`} />
                  <p className="text-xs text-muted-foreground">{idx.label}</p>
                  <p className="text-lg font-bold">{idx.value}/5</p>
                </div>
              ))}
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Вероятность выполнения</span>
                <span className="font-bold">{Math.round(q.completion_probability)}%</span>
              </div>
              <Progress value={q.completion_probability} className="h-2" />
            </div>
          </Section>
        )}

        <Separator />

        {/* Stats */}
        <Section title="Статистика сделок">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <CheckCircle className="h-3.5 w-3.5 mx-auto mb-0.5 text-green-500" />
              <p className="text-xs text-muted-foreground">Надёжность</p>
              <p className="text-sm font-bold">{stats.completionRate}%</p>
              <p className="text-[9px] text-muted-foreground">{stats.completedDeals}/{stats.totalDeals}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-blue-500" />
              <p className="text-xs text-muted-foreground">Скорость</p>
              <p className="text-sm font-bold">{stats.avgDaysToReview} дн.</p>
              <p className="text-[9px] text-muted-foreground">{speedLabels[stats.speedCategory]}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <Star className="h-3.5 w-3.5 mx-auto mb-0.5 text-yellow-500 fill-yellow-500" />
              <p className="text-xs text-muted-foreground">Рейтинг</p>
              <p className="text-sm font-bold">{stats.avgRating.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground">{stats.reviewCount} отзывов</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap mt-1">
            <span>Забирает: <b>{stats.pickupRate}%</b></span>
            <span>Отзыв: <b>{stats.reviewRate}%</b></span>
            {stats.ugcRate > 0 && <span>UGC: <b>{stats.ugcRate}%</b></span>}
            {stats.hasDelays && <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-500/30"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Задержки</Badge>}
            {stats.hasFails && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Срывы</Badge>}
          </div>
        </Section>

        <Separator />

        {/* Reach & Views */}
        <Section title="Охваты и просмотры">
          <div className="grid grid-cols-2 gap-2">
            <InfoBlock icon={Users} label="Подписчики" value={blogger.subscribers_count.toLocaleString()} iconClass="text-primary" />
            <InfoBlock icon={Eye} label="Shorts (7д)" value={(q?.avg_shorts_views || stats.avgShortsViews).toLocaleString()} iconClass="text-violet-500" />
            <InfoBlock icon={Eye} label="Reels (7д)" value={(q?.avg_reels_views || stats.avgReelsViews).toLocaleString()} iconClass="text-pink-500" />
            <InfoBlock icon={Eye} label="Stories" value={(q?.avg_stories_views || 0).toLocaleString()} iconClass="text-orange-500" />
            <InfoBlock icon={Eye} label="Посты" value={(q?.avg_post_views || 0).toLocaleString()} iconClass="text-blue-500" />
            <InfoBlock icon={Eye} label="Видео" value={(q?.avg_video_views || 0).toLocaleString()} iconClass="text-red-500" />
          </div>
        </Section>

        <Separator />

        {/* Audience */}
        {q && (
          <>
            <Section title="Аудитория">
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Муж / Жен</span>
                    <span className="font-medium">{q.audience_gender_male}% / {100 - q.audience_gender_male}%</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500" style={{ width: `${q.audience_gender_male}%` }} />
                    <div className="bg-pink-500" style={{ width: `${100 - q.audience_gender_male}%` }} />
                  </div>
                </div>
                {q.audience_age && <InfoBlock icon={Users} label="Возраст" value={q.audience_age} />}
                {q.audience_geo && <InfoBlock icon={MapPin} label="География" value={q.audience_geo} />}
                {q.purchasing_power && <InfoBlock icon={TrendingUp} label="Покупательская способность" value={purchasingLabels[q.purchasing_power] || q.purchasing_power} />}
              </div>
            </Section>
            <Separator />
          </>
        )}

        {/* Personal */}
        {q && (
          <>
            <Section title="О блогере">
              <div className="space-y-1">
                <InfoBlock icon={Heart} label="Партнёр" value={q.has_partner ? 'Да' : 'Нет'} iconClass="text-rose-500" />
                <InfoBlock icon={Baby} label="Дети" value={q.has_children ? (q.children_ages ? `Да (${q.children_ages} лет)` : 'Да') : 'Нет'} iconClass="text-amber-500" />
                {q.work_style && <InfoBlock icon={Zap} label="Стиль работы" value={workStyleLabels[q.work_style] || q.work_style} iconClass="text-blue-500" />}
                {q.motivation.length > 0 && (
                  <div className="flex items-start gap-2 py-1.5">
                    <Star className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    <span className="text-sm text-muted-foreground">Мотивация:</span>
                    <div className="flex flex-wrap gap-1 ml-auto">
                      {q.motivation.map(m => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs font-medium mt-2 mb-1">Самооценка</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Надёжность</span>
                  <StarRating value={q.self_reliability} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Скорость</span>
                  <StarRating value={q.self_speed} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Качество</span>
                  <StarRating value={q.self_quality} />
                </div>
              </div>
            </Section>
            <Separator />
          </>
        )}

        {/* Content types */}
        <Section title="Контент">
          <div className="flex flex-wrap gap-1.5">
            {stats.doesVideo && <Badge variant="outline" className="gap-1"><Video className="h-3 w-3" />Видео</Badge>}
            {stats.doesPhoto && <Badge variant="outline" className="gap-1"><Camera className="h-3 w-3" />Фото</Badge>}
            {q?.content_style?.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
          </div>
        </Section>

        {/* Sample review */}
        {q?.sample_review && (
          <>
            <Separator />
            <Section title="Пример отзыва на WB">
              <p className="text-xs bg-muted/50 rounded-lg p-3 italic text-muted-foreground">«{q.sample_review}»</p>
            </Section>
          </>
        )}

        {/* Portfolio */}
        {q && (q.best_video_url || q.portfolio_videos.length > 0 || q.portfolio_photos.length > 0 || q.content_examples.length > 0) && (
          <>
            <Separator />
            <Section title="Портфолио и примеры">
              <div className="space-y-1.5">
                {q.best_video_url && (
                  <a href={q.best_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />Лучшее видео
                  </a>
                )}
                {[...q.portfolio_videos, ...q.content_examples].filter(Boolean).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline truncate">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />{url}
                  </a>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Social links */}
        {platformLinks.length > 0 && (
          <>
            <Separator />
            <Section title="Соцсети">
              <div className="space-y-1.5">
                {platformLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-xs">
                    <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-medium">{link.label}</span>
                    <span className="text-muted-foreground truncate ml-auto">{link.url}</span>
                  </a>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Reviews from sellers */}
        {blogger.latestReviews.length > 0 && (
          <>
            <Separator />
            <Section title="Отзывы селлеров">
              <div className="space-y-2">
                {blogger.latestReviews.map((r, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{r.reviewer_name}</span>
                      <StarRating value={r.rating} />
                    </div>
                    {r.comment && <p className="text-xs text-muted-foreground italic">«{r.comment}»</p>}
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BloggerDetailModal;
