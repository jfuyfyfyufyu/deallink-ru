import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DealApprovalActions from './DealApprovalActions';

interface DealContentReviewDialogProps {
  deal: any;
  userId: string;
  open: boolean;
  onClose: () => void;
}

const DealContentReviewDialog = ({ deal, userId, open, onClose }: DealContentReviewDialogProps) => {
  if (!deal) return null;

  const hasContent = deal.content_status === 'submitted';
  const hasReview = deal.review_status === 'submitted';

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {hasContent && hasReview ? 'Согласование' : hasContent ? 'Контент на согласование' : 'Отзыв на согласование'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content approval */}
          {hasContent && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Контент</h3>
              {deal.content_url && (
                deal.content_url.match(/\.(mp4|mov|webm|avi)/) ? (
                  <video src={deal.content_url} controls className="rounded-lg max-h-64 w-full" />
                ) : (
                  <img
                    src={deal.content_url}
                    alt="Контент"
                    className="rounded-lg max-h-64 w-full object-cover cursor-pointer"
                    onClick={() => window.open(deal.content_url, '_blank')}
                  />
                )
              )}
              <DealApprovalActions
                dealId={deal.id}
                senderId={userId}
                type="content"
                bloggerId={deal.blogger_id}
                sellerId={deal.seller_id}
                productName={deal.products?.name}
                onDone={onClose}
              />
            </div>
          )}

          {/* Review approval */}
          {hasReview && (
            <div className="space-y-3">
              {hasContent && <div className="border-t border-border" />}
              <h3 className="text-sm font-semibold">Отзыв</h3>
              {deal.review_text && (
                <p className="text-sm bg-muted rounded-lg p-3 whitespace-pre-wrap">{deal.review_text}</p>
              )}
              {deal.review_media_urls?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {deal.review_media_urls.map((url: string, i: number) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="h-20 w-20 rounded-lg object-cover cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              )}
              <DealApprovalActions
                dealId={deal.id}
                senderId={userId}
                type="review"
                bloggerId={deal.blogger_id}
                sellerId={deal.seller_id}
                productName={deal.products?.name}
                onDone={onClose}
              />
            </div>
          )}

          {!hasContent && !hasReview && (
            <p className="text-sm text-muted-foreground text-center py-4">Нет материалов на согласование</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealContentReviewDialog;
