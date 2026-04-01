import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionnaireData, NICHES } from '../types';
import { Button } from '@/components/ui/button';
import { Upload, UserCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  data: QuestionnaireData;
  onChange: (d: Partial<QuestionnaireData>) => void;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
}

const StepBasicInfo = ({ data, onChange, avatarUrl, onAvatarChange }: Props) => {
  const { user } = useAuth();
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      await supabase.storage.from('proofs').upload(path, file, { upsert: true });
      const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path);
      onAvatarChange(urlData.publicUrl);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user.id);
    } catch (_) { /* ignore */ }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <input type="file" ref={ref} accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <UserCircle className="h-10 w-10 text-primary/50" />
            </div>
          )}
          <Button variant="secondary" size="icon" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
            onClick={() => ref.current?.click()} disabled={uploading}>
            <Upload className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div><Label>ФИО *</Label>
        <Input value={data.full_name} onChange={e => onChange({ full_name: e.target.value })} placeholder="Иванов Иван Иванович" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Возраст</Label>
          <Input type="number" value={data.age || ''} onChange={e => onChange({ age: Number(e.target.value) || null })} placeholder="25" />
        </div>
        <div><Label>Город</Label>
          <Input value={data.city} onChange={e => onChange({ city: e.target.value })} placeholder="Москва" />
        </div>
      </div>
      <div><Label>Страна</Label>
        <Select value={data.country} onValueChange={v => onChange({ country: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Россия">Россия</SelectItem>
            <SelectItem value="Казахстан">Казахстан</SelectItem>
            <SelectItem value="Беларусь">Беларусь</SelectItem>
            <SelectItem value="Узбекистан">Узбекистан</SelectItem>
            <SelectItem value="Другая">Другая</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Тематика блога *</Label>
        <Select value={(data as any).niche || ''} onValueChange={v => onChange({ niche: v } as any)}>
          <SelectTrigger><SelectValue placeholder="Выберите тематику" /></SelectTrigger>
          <SelectContent>
            {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StepBasicInfo;
