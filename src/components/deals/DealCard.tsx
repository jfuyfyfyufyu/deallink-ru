import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, AlertTriangle, Clock, MoreHorizontal, MessageCircle, User, Copy, Link2, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import DealProgressBar from './DealProgressBar';
import DealPaymentFlow from './DealPaymentFlow';
import { HUMAN_STATUS, getNextActionSeller, getNextActionBlogger, getDealAlerts, type NextAction } from './deal-utils';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  deal: any;
  isSeller: boolean;
  userId: string;
  onAction: (deal: any, action: string) => void;
  onOpenDetail: (deal: any) => void;
  onChat: (deal: any) => void;
  existingReview?: boolean;
  isArchived?: boolean;
}

const DealCard = ({ deal, isSeller, userId, onAction, onOpenDetail, onChat, existingReview, isArchived }: Props) => {
  const humanStatus = HUMAN_STATUS[deal.status] || { emoji: '', label: deal.status };
  const nextAction: NextAction | null = isSeller ? getNextActionSeller(deal) : getNextActionBlogger(deal);
  const alerts = getDealAlerts(deal, isSeller);
  const isActive = !['requested', 'counter_proposed', 'cancelled', 'finished'].includes(deal.status);
  const counterpart = isSeller ? deal.blogger : deal.seller;
  const trustScore = isSeller ? deal.blogger?.trust_score : null;

  const createdAgo = formatDistanceToNow(new Date(deal.created_at), { locale: ru, addSuffix: true });
  const statusHistory = (deal.status_history || []) as Array<{ status: string; at: string }>;
  const totalDays = deal.status === 'finished' && statusHistory.length >= 2
    ? differenceInDays(new Date(statusHistory[statusHistory.length - 1].at), new Date(statusHistory[0].at))
    : null;

  // Color-coded left border by state
  const borderColor = deal.status === 'cancelled' ? 'border-l-destructive'
    : deal.status === 'finished' ? 'border-l-primary'
    : alerts.length > 0 && alerts.some(a => a.type === 'danger') ? 'border-l-destructive'
    : isActive ? 'border-l-amber-500' : 'border-l-muted';

  return (
    <Card
      className={`glass-card card-hover-lift cursor-pointer border-border/50 border-l-4 ${borderColor}`}
      onClick={() => onOpenDetail(deal)}
    >
      <CardContent className="p-4 space-y-3">
        {/* 1. Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{deal.products?.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground truncate">
                {counterpart?.name || (isSeller ? 'Блогер' : 'Селлер')}
              </span>
              {trustScore != null && trustScore > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {Number(trustScore).toFixed(1)}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">{createdAgo}</span>
              {totalDays != null && (
                <span className="text-[10px] text-primary font-medium">{totalDays} дн.</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {humanStatus.emoji} {humanStatus.label}
            </Badge>
          </div>
        </div>

        {/* Pending approval indicator */}
        {(deal.content_status === 'submitted' || deal.review_status === 'submitted') && isSeller && (
          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
            {deal.content_status === 'submitted' && deal.review_status === 'submitted'
              ? 'Контент и отзыв на согласовании'
              : deal.content_status === 'submitted'
              ? 'Контент на согласовании'
              : 'Отзыв на согласовании'}
          </Badge>
        )}

        {/* 2. Progress */}
        {isActive && <DealProgressBar status={deal.status} statusHistory={statusHistory} />}

        {/* 3. Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs rounded-md px-2 py-1.5 ${
                  alert.type === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {alert.type === 'danger' ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}
                <span>{alert.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* 4. Payment flow */}
        <DealPaymentFlow deal={deal} isSeller={isSeller} userId={userId} />

        {/* 5. Next action (skip payment-related — handled by DealPaymentFlow) */}
        {nextAction && !nextAction.action.startsWith('wait') && !['request_advance', 'confirm_payment', 'pay'].includes(nextAction.action) && (
          <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-muted-foreground">Следующее действие:</p>
            <Button
              className="w-full"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAction(deal, nextAction.action); }}
            >
              {nextAction.emoji} {nextAction.label}
            </Button>
          </div>
        )}

        {nextAction && nextAction.action.startsWith('wait') && !['wait_details', 'wait_payment', 'wait_confirm', 'wait_order'].includes(nextAction.action) && (
          <p className="text-xs text-muted-foreground text-center py-1">{nextAction.emoji} {nextAction.label}</p>
        )}

        {/* 6. Secondary actions */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {isActive && (
            <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => onChat(deal)}>
              <MessageCircle className="h-3 w-3 mr-1" /> Чат
            </Button>
          )}

          {isSeller && (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onAction(deal, 'view_blogger')}>
              <User className="h-3 w-3 mr-1" /> Профиль
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {deal.utm_url && (
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(deal.utm_url); }}>
                  <Link2 className="h-3 w-3 mr-2" /> Копировать UTM
                </DropdownMenuItem>
              )}
              {isSeller && !deal.utm_url && deal.products?.marketplace_url && isActive && (
                <DropdownMenuItem onClick={() => onAction(deal, 'generate_utm')}>
                  <Link2 className="h-3 w-3 mr-2" /> Создать UTM
                </DropdownMenuItem>
              )}
              {deal.tracking_token && isActive && (
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/track/${deal.tracking_token}`); }}>
                  <Copy className="h-3 w-3 mr-2" /> Трекинг-ссылка
                </DropdownMenuItem>
              )}
              {deal.content_url && (
                <DropdownMenuItem onClick={() => window.open(deal.content_url, '_blank')}>
                  <ExternalLink className="h-3 w-3 mr-2" /> Контент
                </DropdownMenuItem>
              )}
              {deal.status === 'finished' && !existingReview && (
                <DropdownMenuItem onClick={() => onAction(deal, 'leave_review')}>
                  <Star className="h-3 w-3 mr-2" /> Оставить отзыв
                </DropdownMenuItem>
              )}
              {deal.status === 'finished' && isSeller && (
                <DropdownMenuItem onClick={() => onAction(deal, 'work_again')}>
                  Работать снова
                </DropdownMenuItem>
              )}
              {deal.status === 'requested' && isSeller && (
                <DropdownMenuItem className="text-destructive" onClick={() => onAction(deal, 'reject')}>
                  Отклонить
                </DropdownMenuItem>
              )}
              {/* Cancel for seller before filming */}
              {isSeller && ['approved', 'ordered', 'in_pvz', 'picked_up'].includes(deal.status) && (
                <DropdownMenuItem className="text-destructive" onClick={() => onAction(deal, 'cancel')}>
                  Отменить сделку
                </DropdownMenuItem>
              )}
              {/* Cancel for blogger before pickup */}
              {!isSeller && ['approved', 'ordered'].includes(deal.status) && (
                <DropdownMenuItem className="text-destructive" onClick={() => onAction(deal, 'cancel')}>
                  Отменить сделку
                </DropdownMenuItem>
              )}
              {['finished', 'cancelled'].includes(deal.status) && !isArchived && (
                <DropdownMenuItem onClick={() => onAction(deal, 'archive')}>
                  В архив
                </DropdownMenuItem>
              )}
              {isArchived && (
                <DropdownMenuItem onClick={() => onAction(deal, 'unarchive')}>
                  Из архива
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Published content links */}
        {['review_posted', 'finished'].includes(deal.status) && (() => {
          const links = deal.social_links as Record<string, string> | null;
          const hasLinks = links && Object.values(links).some(v => v);
          if (hasLinks) {
            return (
              <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                {Object.entries(links!).filter(([, v]) => v).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline capitalize">
                    <ExternalLink className="h-3 w-3 shrink-0" /> {platform}
                  </a>
                ))}
              </div>
            );
          }
          if (deal.utm_url) {
            return (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <a href={deal.utm_url} target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                  <ExternalLink className="h-3 w-3 shrink-0" /> Публикация
                </a>
              </div>
            );
          }
          return null;
        })()}

        {/* Analytics mini */}
        {deal.utm_url && (deal.views_count || deal.click_count > 0) && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {deal.views_count != null && <span>{deal.views_count} просм.</span>}
            {deal.click_count > 0 && <span>{deal.click_count} кликов</span>}
            {deal.views_count && deal.click_count > 0 && (
              <span className="text-primary font-medium">{((deal.click_count / deal.views_count) * 100).toFixed(1)}%</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DealCard;
