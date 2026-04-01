import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Star, Handshake, CheckCircle2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const SellerProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [telegram, setTelegram] = useState(profile?.telegram_id || '');
  const [saving, setSaving] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['seller-profile-stats', user?.id],
    queryFn: async () => {
      const [totalDeals, finishedDeals, products] = await Promise.all([
        supabase.from('deals').select('id', { count: 'exact', head: true }).eq('seller_id', user!.id),
        supabase.from('deals').select('id', { count: 'exact', head: true }).eq('seller_id', user!.id).eq('status', 'finished'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', user!.id),
      ]);
      return {
        totalDeals: totalDeals.count || 0,
        finishedDeals: finishedDeals.count || 0,
        products: products.count || 0,
      };
    },
    enabled: !!user,
  });

  const { data: reviewsAboutMe } = useQuery({
    queryKey: ['seller-reviews-about-me', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name)')
        .eq('target_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name, telegram_id: telegram }).eq('user_id', profile.user_id);
    if (error) toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    else toast({ title: 'Сохранено!' });
    setSaving(false);
  };

  return (
    <DashboardLayout title="Мой профиль">
      <div className="max-w-md mx-auto space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-accent fill-accent" />
              <p className="text-lg font-bold">{Number(profile?.trust_score || 0).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Рейтинг</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Package className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats?.products ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Товаров</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Handshake className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats?.totalDeals ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Сделок</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats?.finishedDeals ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Завершено</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base">Данные профиля</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Имя / Компания</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Telegram</Label><Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" /></div>
            <div><Label>Email</Label><Input value={user?.email || ''} disabled className="opacity-60" /></div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </CardContent>
        </Card>

        {reviewsAboutMe && reviewsAboutMe.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-base">Отзывы обо мне</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {reviewsAboutMe.map((r: any) => (
                <div key={r.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.reviewer?.name || 'Блогер'}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-3 w-3 ${i <= r.rating ? 'text-accent fill-accent' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SellerProfile;
