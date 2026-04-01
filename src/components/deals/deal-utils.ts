// Shared deal logic for both seller and blogger views

export const DEAL_STEPS = [
  { key: 'approved', emoji: '', label: 'Оплата' },
  { key: 'ordered', emoji: '', label: 'Заказ' },
  { key: 'picked_up', emoji: '', label: 'Доставка' },
  { key: 'filming', emoji: '', label: 'Контент' },
  { key: 'review_posted', emoji: '', label: 'Публикация' },
  { key: 'finished', emoji: '', label: 'Итоги' },
] as const;

export function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    requested: -1, counter_proposed: -1, approved: 0, ordered: 1, in_pvz: 1, picked_up: 2, filming: 3, review_posted: 4, finished: 5, cancelled: -2,
  };
  return map[status] ?? -1;
}

export const HUMAN_STATUS: Record<string, { emoji: string; label: string }> = {
  requested: { emoji: '', label: 'Новая заявка' },
  counter_proposed: { emoji: '', label: 'Ожидаем подтверждения правок' },
  approved: { emoji: '', label: 'Ждём оплату' },
  ordered: { emoji: '', label: 'Ждём заказ' },
  in_pvz: { emoji: '', label: 'Доставка' },
  picked_up: { emoji: '', label: 'Доставка' },
  filming: { emoji: '', label: 'В работе' },
  review_posted: { emoji: '', label: 'Опубликовано' },
  finished: { emoji: '', label: 'Завершено' },
  cancelled: { emoji: '', label: 'Отменено' },
};

export type PaymentStatus = 'none' | 'details_requested' | 'details_sent' | 'paying' | 'paid_pending' | 'confirmed' | 'problem';

export function getPaymentStatus(deal: any): PaymentStatus {
  const ps = deal.payment_status;
  if (ps === 'confirmed') return 'confirmed';
  if (ps === 'problem') return 'problem';
  if (ps === 'paid_pending') return 'paid_pending';
  if (ps === 'paying' || (deal.payment_details && ps !== 'details_requested' && ps !== 'details_sent')) return 'paying';
  if (ps === 'details_sent') return 'details_sent';
  if (ps === 'details_requested') return 'details_requested';
  return 'none';
}

export const PAYMENT_STATUS_DISPLAY: Record<PaymentStatus, { emoji: string; label: string; color: string }> = {
  none: { emoji: '', label: 'Не оплачено', color: 'text-muted-foreground' },
  details_requested: { emoji: '', label: 'Запрос реквизитов', color: 'text-amber-500' },
  details_sent: { emoji: '', label: 'Реквизиты получены', color: 'text-blue-500' },
  paying: { emoji: '', label: 'Ожидает оплату', color: 'text-amber-500' },
  paid_pending: { emoji: '', label: 'Ожидает подтверждение', color: 'text-amber-500' },
  confirmed: { emoji: '', label: 'Оплачено', color: 'text-emerald-500' },
  problem: { emoji: '', label: 'Проблема', color: 'text-destructive' },
};

export interface NextAction {
  label: string;
  emoji: string;
  action: string;
}

// ─── SELLER ACTIONS ───
export function getNextActionSeller(deal: any): NextAction | null {
  if (deal.status === 'counter_proposed') {
    return { label: 'Блогер предложил правку', emoji: '', action: 'view_counter' };
  }

  if (deal.status === 'requested') {
    if (deal.initiated_by === 'seller') {
      return { label: 'Ждём ответ блогера', emoji: '', action: 'wait_blogger' };
    }
    return { label: 'Одобрить заявку', emoji: '', action: 'approve' };
  }

  if (deal.status === 'approved') {
    const ps = getPaymentStatus(deal);
    if (ps === 'none') return { label: 'Ждём реквизиты блогера', emoji: '', action: 'wait_details' };
    if (ps === 'details_sent') return { label: 'Оплатить аванс', emoji: '', action: 'pay' };
    if (ps === 'paid_pending') return { label: 'Ждём подтверждение оплаты', emoji: '', action: 'wait_confirm' };
    if (ps === 'confirmed') return { label: 'Ждём заказ блогера', emoji: '', action: 'wait_order' };
    if (ps === 'problem') return { label: 'Проблема с оплатой', emoji: '', action: 'pay' };
    return { label: 'Ждём блогера', emoji: '', action: 'wait_generic' };
  }

  if (deal.status === 'ordered') return { label: 'Блогер ждёт доставку', emoji: '', action: 'wait_delivery' };
  if (deal.status === 'in_pvz') return { label: 'Блогер забирает товар', emoji: '', action: 'wait_pickup' };
  if (deal.status === 'picked_up') return { label: 'Блогер снимает ролик', emoji: '', action: 'wait_filming' };

  if (deal.status === 'filming') {
    if (deal.content_status === 'submitted') return { label: 'Проверить контент', emoji: '', action: 'review_content' };
    if (deal.content_status === 'approved' && deal.review_status === 'submitted') return { label: 'Проверить отзыв', emoji: '', action: 'review_review' };
    if (deal.content_status === 'approved' && deal.review_status === 'approved') return { label: 'Ждём публикацию', emoji: '', action: 'wait_publish' };
    if (!deal.content_status || deal.content_status === 'rejected') return { label: 'Ждём контент от блогера', emoji: '', action: 'wait_content' };
    if (deal.content_status === 'approved' && (!deal.review_status || deal.review_status === 'rejected')) return { label: 'Ждём отзыв от блогера', emoji: '', action: 'wait_review' };
    return { label: 'В работе у блогера', emoji: '', action: 'wait_generic' };
  }

  if (deal.status === 'review_posted') return { label: 'Завершить сделку', emoji: '', action: 'finish' };

  return null;
}

// ─── BLOGGER ACTIONS ───
export function getNextActionBlogger(deal: any): NextAction | null {
  if (deal.status === 'counter_proposed') {
    return { label: 'Ожидаем подтверждения правок', emoji: '', action: 'wait_counter' };
  }

  if (deal.status === 'requested') {
    if (deal.initiated_by === 'blogger') return { label: 'Ждём ответ селлера', emoji: '', action: 'wait_seller' };
    return { label: 'Рассмотреть оффер', emoji: '', action: 'review_offer' };
  }

  if (deal.status === 'approved') {
    const ps = getPaymentStatus(deal);
    if (ps === 'none') return { label: 'Запросить аванс', emoji: '', action: 'request_advance' };
    if (ps === 'details_sent') return { label: 'Ждём оплату от селлера', emoji: '', action: 'wait_payment' };
    if (ps === 'paid_pending') return { label: 'Подтвердить получение', emoji: '', action: 'confirm_payment' };
    if (ps === 'confirmed') return { label: 'Заказать товар', emoji: '', action: 'order' };
    if (ps === 'problem') return { label: 'Проблема с оплатой', emoji: '', action: 'wait_payment' };
    return { label: 'Ожидание', emoji: '', action: 'wait_generic' };
  }

  if (deal.status === 'ordered') return { label: 'Заказ в ПВЗ', emoji: '', action: 'in_pvz' };
  if (deal.status === 'in_pvz') return { label: 'Забрал посылку', emoji: '', action: 'pickup' };
  if (deal.status === 'picked_up') return { label: 'Снимаю ролик', emoji: '', action: 'start_filming' };

  if (deal.status === 'filming') {
    if (!deal.content_status || deal.content_status === 'rejected') return { label: 'Отправить контент', emoji: '', action: 'submit_content' };
    if (deal.content_status === 'submitted') return { label: 'Ждём проверку контента', emoji: '', action: 'wait_content_review' };
    if (deal.content_status === 'approved' && (!deal.review_status || deal.review_status === 'rejected')) return { label: 'Отправить отзыв', emoji: '', action: 'submit_review' };
    if (deal.review_status === 'submitted') return { label: 'Ждём проверку отзыва', emoji: '', action: 'wait_review_review' };
    if (deal.review_status === 'approved') return { label: 'Опубликовал', emoji: '', action: 'publish' };
    return null;
  }

  if (deal.status === 'review_posted') return { label: 'Ждём завершение от селлера', emoji: '', action: 'wait_finish' };

  return null;
}

export function getDealAlerts(deal: any, isSeller: boolean): Array<{ text: string; type: 'warning' | 'danger' }> {
  const alerts: Array<{ text: string; type: 'warning' | 'danger' }> = [];
  const now = new Date();

  if (deal.deadline_pickup) {
    const dp = new Date(deal.deadline_pickup);
    const hoursLeft = (dp.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 0 && ['approved', 'ordered', 'in_pvz'].includes(deal.status)) {
      alerts.push({ text: 'Просрочен срок получения товара', type: 'danger' });
    } else if (hoursLeft < 24 && hoursLeft > 0 && ['approved', 'ordered', 'in_pvz'].includes(deal.status)) {
      alerts.push({ text: 'Срок получения товара истекает сегодня', type: 'warning' });
    }
  }

  if (deal.deadline_content) {
    const dc = new Date(deal.deadline_content);
    const hoursLeft = (dc.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 0 && ['picked_up', 'filming'].includes(deal.status)) {
      alerts.push({ text: 'Просрочен срок контента', type: 'danger' });
    } else if (hoursLeft < 24 && hoursLeft > 0 && ['picked_up', 'filming'].includes(deal.status)) {
      alerts.push({ text: 'Срок публикации контента сегодня', type: 'warning' });
    }
  }

  if (getPaymentStatus(deal) === 'problem') {
    alerts.push({ text: 'Проблема с оплатой', type: 'danger' });
  }

  if (getPaymentStatus(deal) === 'paid_pending' && isSeller) {
    alerts.push({ text: 'Ожидает подтверждение оплаты', type: 'warning' });
  }

  return alerts;
}
