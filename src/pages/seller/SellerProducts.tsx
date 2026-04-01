import { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, ExternalLink, Pencil, Trash2, ToggleLeft, ToggleRight, Upload, Search } from 'lucide-react';
import BloggerSearchSheet from '@/components/blogger-search/BloggerSearchSheet';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const emptyForm = { name: '', marketplace_url: '', description: '', requirements: '', target_audience: '', min_views: 0, image_url: '', deadline_days: 0 };

const SellerProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('seller_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `${user!.id}/${Date.now()}.webp`;
      const { error } = await supabase.storage.from('product-images').upload(path, compressed);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    } catch (e: any) {
      toast({ title: 'Ошибка загрузки', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, image_url: form.image_url || null, deadline_days: form.deadline_days || null };
      if (editId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, seller_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      closeDialog();
      toast({ title: editId ? 'Товар обновлён!' : 'Товар добавлен!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message === 'Load failed' ? 'Ошибка сети. Проверьте соединение и попробуйте снова.' : e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast({ title: 'Товар удалён' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-products'] }),
  });

  const closeDialog = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      marketplace_url: p.marketplace_url || '',
      description: p.description || '',
      requirements: p.requirements || '',
      target_audience: p.target_audience || '',
      min_views: p.min_views || 0,
      image_url: p.image_url || '',
      deadline_days: p.deadline_days || 0,
    });
    setOpen(true);
  };

  return (
    <DashboardLayout title="Мои товары">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Мои товары</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <BloggerSearchSheet
              trigger={
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                  <Search className="h-4 w-4 mr-1" /> Найти блогера
                </Button>
              }
            />
            <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1 sm:flex-none"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div><Label>Название</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><Label>Ссылка на WB/Ozon</Label><Input value={form.marketplace_url} onChange={e => setForm(f => ({ ...f, marketplace_url: e.target.value }))} /></div>
                  <div>
                    <Label>Фото товара</Label>
                    <input type="file" ref={fileRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} className="hidden" />
                    <div className="mt-1">
                      {form.image_url ? (
                        <div className="relative">
                          <img src={form.image_url} alt="Product" className="rounded-lg h-32 w-full object-cover" />
                          <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                            {uploading ? 'Загрузка...' : 'Заменить'}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Загрузка...' : 'Загрузить фото'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div><Label>Описание</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div><Label>Требования</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} /></div>
                  <div><Label>Целевая аудитория</Label><Input value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} /></div>
                  <div><Label>Мин. просмотры</Label><Input type="number" min={0} placeholder="0" value={form.min_views || ''} onChange={e => setForm(f => ({ ...f, min_views: e.target.value === '' ? 0 : Number(e.target.value) }))} /></div>
                  <div><Label>Дедлайн выполнения (дней)</Label><Input type="number" min={0} placeholder="Например: 14" value={form.deadline_days || ''} onChange={e => setForm(f => ({ ...f, deadline_days: Number(e.target.value) }))} /><p className="text-xs text-muted-foreground mt-1">Сколько дней даётся блогеру на выполнение задания</p></div>
                  <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                    {saveMutation.isPending ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          {products?.map((p) => (
            <Card key={p.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.description || 'Без описания'}</p>
                    {p.min_views && p.min_views > 0 ? (
                      <p className="text-xs text-muted-foreground">Мин. {p.min_views} просм.</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs">
                    {p.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                  <div className="flex-1" />
                  {p.marketplace_url && (
                    <a href={p.marketplace_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}>
                    {p.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {products?.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Добавьте первый товар для бартера</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SellerProducts;
