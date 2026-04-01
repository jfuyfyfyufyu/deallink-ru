import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Clock, CheckCircle, ShieldCheck, ShieldAlert, Sparkles, Users, Eye, Link2, Info, MapPin, Baby, Heart, TrendingUp } from 'lucide-react';
import type { EnrichedBlogger } from './types';
import type { ScoredBlogger } from './recommendation-engine';
import BloggerDetailModal from './BloggerDetailModal';

interface Props {
  blogger: EnrichedBlogger | ScoredBlogger;
  selected: boolean;
  onToggle: (id: string) => void;
  onPropose: (blogger: EnrichedBlogger | ScoredBlogger) => void;
}

const badgeConfig = {
  recommended: { label: 'Рекомендуем', icon: <ShieldCheck className="h-3 w-3" />, className: 'bg-green-500/15 text-green-700 border-green-500/30' },
  risk: { label: 'Риск', icon: <ShieldAlert className="h-3 w-3" />, className: 'bg-destructive/15 text-destructive border-destructive/30' },
  new: { label: 'Новый', icon: <Sparkles className="h-3 w-3" />, className: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
};

const tierConfig = {
  recommended: { label: 'Рекомендуем', className: 'bg-green-500/15 text-green-700 border-green-500/30' },
  suitable: { label: 'Подходит', className: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30' },
  weak: { label: 'Слабый', className: 'bg-muted text-muted-foreground border-border' },
};

function isScored(b: EnrichedBlogger | ScoredBlogger): b is ScoredBlogger {
  return 'score' in b && 'tier' in b;
}

const BloggerCard = ({ blogger, selected, onToggle, onPropose }: Props) => {
  const { stats } = blogger;
  const badge = stats.badge ? badgeConfig[stats.badge] : null;
  const [showDetail, setShowDetail] = useState(false);
  const scored = isScored(blogger);

  const hasChildren = blogger.questionnaire?.has_children ?? false;
  const hasPartner = blogger.questionnaire?.has_partner ?? false;
  const city = blogger.questionnaire?.city || '';

  return (
    <>
      <Card className={`transition-all ${selected ? 'ring-2 ring-primary' : ''} ${scored && blogger.tier === 'weak' ? 'opacity-60' : ''}`}>
        <CardContent className="p-3 space-y-2.5">
          {/* Header with score */}
          <div className="flex items-center gap-2.5">
            <Checkbox checked={selected} onCheckedChange={() => onToggle(blogger.user_id)} className="shrink-0" />
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={blogger.avatar_url || ''} />
              <AvatarFallback className="text-xs">{blogger.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm truncate">{blogger.name}</p>
                {scored && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    blogger.score >= 80 ? 'bg-green-500/15 text-green-700' :
                    blogger.score >= 60 ? 'bg-yellow-500/15 text-yellow-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {blogger.score}
                  </span>
                )}
                {!scored && badge && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-0.5 shrink-0 ${badge.className}`}>
                    {badge.icon}{badge.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                {blogger.niche && <span>{blogger.niche}</span>}
                {city && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />{city}
                  </span>
                )}
                {scored && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierConfig[blogger.tier].className}`}>
                    {tierConfig[blogger.tier].label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowDetail(true)}>
                <Info className="h-3 w-3 mr-1" />Ещё
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={() => onPropose(blogger)}>
                Оффер
              </Button>
            </div>
          </div>

          {/* Reasons chips */}
          {scored && blogger.reasons.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {blogger.reasons.map((r, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Tags: children, partner */}
          {(hasChildren || hasPartner) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasChildren && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 bg-orange-500/10 text-orange-700 border-orange-500/30">
                  <Baby className="h-2.5 w-2.5" />Есть дети
                </Badge>
              )}
              {hasPartner && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 bg-pink-500/10 text-pink-700 border-pink-500/30">
                  <Heart className="h-2.5 w-2.5" />Партнёр
                </Badge>
              )}
            </div>
          )}

          {/* Audience & Views */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-muted/50 rounded-md p-1.5 text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">Подписчики</span>
              </div>
              <p className="text-sm font-bold">{blogger.subscribers_count.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-md p-1.5 text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Eye className="h-3 w-3 text-violet-500" />
                <span className="text-[10px] text-muted-foreground">Все просмотры</span>
              </div>
              <p className="text-sm font-bold">{stats.avgTotalViews.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-md p-1.5 text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Link2 className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground leading-tight">Со ссылкой</span>
              </div>
              <p className="text-sm font-bold">{stats.avgLinkableViews.toLocaleString()}</p>
            </div>
          </div>

          {/* Stats: Reliability, Speed, Rating */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-muted/50 rounded-md p-1.5 text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-[10px] text-muted-foreground">Надёжность</span>
              </div>
              <p className="text-sm font-bold">{stats.completionRate}%</p>
              <p className="text-[9px] text-muted-foreground">{stats.completedDeals}/{stats.totalDeals} сделок</p>
            </div>
            <div className="bg-muted/50 rounded-md p-1.5 text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-[10px] text-muted-foreground">Скорость</span>
              </div>
              <p className="text-sm font-bold">{stats.avgDaysToReview} дн.</p>
            </div>
            <div className="bg-muted/50 rounded-md p-1.5 text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] text-muted-foreground">Рейтинг</span>
              </div>
              <p className="text-sm font-bold">{stats.avgRating.toFixed(1)}</p>
            </div>
          </div>

          {/* Prediction (only for scored bloggers) */}
          {scored && (
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-primary/5 border border-primary/10">
              <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="flex gap-3 text-[10px]">
                <span>~{blogger.prediction.expectedViews.toLocaleString()} просм.</span>
                <span>~{blogger.prediction.expectedClicks} кликов</span>
                <span>CTR {blogger.prediction.expectedCtr}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BloggerDetailModal blogger={blogger} open={showDetail} onOpenChange={setShowDetail} />
    </>
  );
};

export default BloggerCard;
