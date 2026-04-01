import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Handshake, CheckCircle2, Upload, UserCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const NICHES = ['Бьюти', 'Еда', 'Фитнес', 'Мода', 'Технологии', 'Путешествия', 'Лайфстайл', 'Дом и уют', 'Дети', 'Авто'];
const FORMATS = ['Reels / Shorts', 'Stories', 'Полноценный обзор', 'Распаковка', 'Фотоотзыв'];

const BloggerProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [telegram, setTelegram] = useState(profile?.telegram_id || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [niche, setNiche] = useState((profile as any)?.niche || '');
  const [bio, setBio] = useState((profile as any)?.bio || '');
  const [subscribersCount, setSubscribersCount] = useState((profile as any)?.subscribers_count || 0);
  const [contentFormats, setContentFormats] = useState<string[]>((profile as any)?.content_formats || []);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const { data: stats } = useQuery({
    queryKey: ['blogger-stats', user?.id],
    queryFn: async () => {
      const [total, finished] = await Promise.all([
        supabase.from('deals').select('id', { count: 'exact', head: true }).eq('blogger_id', user!.id),
        supabase.from('deals').select('id', { count: 'exact', head: true }).eq('blogger_id', user!.id).eq('status', 'finished'),
      ]);
      return { total: total.count || 0, finished: finished.count || 0 };
    },
    enabled: !!user,
  });

  const { data: reviewsAboutMe } = useQuery({
    queryKey: ['blogger-reviews-about-me', user?.id],
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

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user!.id}.${ext}`;
      const { error } = await supabase.storage.from('proofs').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user!.id);
      toast({ title: 'Фото обновлено!' });
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleFormat = (f: string) => {
    setContentFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name,
      telegram_id: telegram,
      niche: niche || null,
      bio: bio || null,
      subscribers_count: subscribersCount,
      content_formats: contentFormats,
    } as any).eq('user_id', profile.user_id);
    if (error) toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    else toast({ title: 'Сохранено!' });
    setSaving(false);
  };

  return (
    <DashboardLayout title="Мой профиль">
      <div className="max-w-md mx-auto space-y-4 animate-fade-in">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <input type="file" ref={avatarRef} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} className="hidden" />
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <UserCircle className="h-12 w-12 text-primary/50" />
              </div>
            )}
            <Button variant="secondary" size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-accent fill-accent" />
              <p className="text-lg font-bold">{Number(profile?.trust_score || 0).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Рейтинг</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Handshake className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats?.total ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Сделок</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats?.finished ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Завершено</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base">Данные профиля</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Имя</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Telegram</Label><Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" /></div>
            <div><Label>Email</Label><Input value={user?.email || ''} disabled className="opacity-60" /></div>
            <div><Label>О себе</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Расскажите о своём канале..." /></div>
            <div>
              <Label>Тематика</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите тематику" /></SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Кол-во подписчиков</Label>
              <Input type="number" value={subscribersCount} onChange={e => setSubscribersCount(Number(e.target.value))} />
            </div>
            <div>
              <Label>Форматы контента</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {FORMATS.map((f) => (
                  <Badge
                    key={f}
                    variant={contentFormats.includes(f) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFormat(f)}
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
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
                    <p className="text-sm font-medium">{r.reviewer?.name || 'Селлер'}</p>
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

export default BloggerProfile;
