import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { CardListSkeleton } from '@/components/ui/skeletons';

const SellerReviews = () => {
  const { user } = useAuth();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['seller-reviews', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, target:profiles!reviews_target_id_fkey(name), deals(products(name))')
        .eq('reviewer_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout title="Мои отзывы">
      <div className="space-y-3 animate-fade-in">
        {isLoading && <p className="text-muted-foreground">Загрузка...</p>}
        {reviews?.map((r: any) => (
          <Card key={r.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{r.target?.name || 'Блогер'}</p>
                  <p className="text-xs text-muted-foreground">{r.deals?.products?.name || ''}</p>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= r.rating ? 'text-accent fill-accent' : 'text-muted'}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString('ru')}</p>
            </CardContent>
          </Card>
        ))}
        {!isLoading && reviews?.length === 0 && <p className="text-muted-foreground text-center py-8">Отзывов пока нет</p>}
      </div>
    </DashboardLayout>
  );
};

export default SellerReviews;
