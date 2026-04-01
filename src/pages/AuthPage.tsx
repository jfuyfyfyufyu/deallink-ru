import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Package, Users, ArrowRight, Loader2 } from 'lucide-react';
import AnimatedBackground from '@/components/ui/animated-background';

const BOT_USERNAME = 'BlogerTop_bot';
const BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

const AuthPage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [role, setRole] = useState<'blogger' | 'seller'>('blogger');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [step, setStep] = useState<'choose' | 'code'>('choose');
  const { toast } = useToast();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerPoll = useCallback(async () => {
    try {
      await fetch(`${BASE_URL}/telegram-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quick' }),
      });
    } catch {}
  }, []);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    setPolling(true);
    triggerPoll();
    pollIntervalRef.current = setInterval(triggerPoll, 3000);
  }, [triggerPoll]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (user) {
    const userRole = profile?.role || 'blogger';
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/blogger" replace />;
  }

  const botLink = `https://t.me/${BOT_USERNAME}?start=${role}`;

  const handleOpenBot = () => {
    startPolling();
    setTimeout(() => setStep('code'), 2000);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: 'Ошибка', description: 'Введите 6-значный код', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await triggerPoll();
      await new Promise(r => setTimeout(r, 500));

      const res = await fetch(`${BASE_URL}/telegram-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Неверный код', variant: 'destructive' });
        setLoading(false);
        return;
      }

      stopPolling();

      const { error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Успешно!', description: 'Вы авторизованы' });
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Ошибка соединения', variant: 'destructive' });
    }
    setLoading(false);
  };

  const roleOptions = [
    { value: 'seller' as const, label: 'Селлер', icon: Package, desc: 'Размещаю товары на маркетплейсах' },
    { value: 'blogger' as const, label: 'Блогер', icon: Users, desc: 'Делаю обзоры и контент' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md animate-fade-in relative card-gradient-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-display">
            DEAL<span className="text-primary">LINK</span>
          </CardTitle>
          <CardDescription>Вход через Telegram</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'choose' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Выберите роль</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 card-hover-lift ${
                        role === opt.value
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border/40 hover:border-border/70 bg-secondary/30'
                      }`}
                    >
                      <opt.icon className={`h-6 w-6 ${role === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full gap-2 rounded-full btn-shimmer" size="lg" onClick={handleOpenBot}>
                  <a href={botLink} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4" />
                    Открыть Telegram-бота
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Нажмите /start в боте — код придёт мгновенно
                </p>
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-full"
                  onClick={() => { setStep('code'); startPolling(); }}
                >
                  У меня есть код
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {polling && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Ожидаем код от бота...
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-muted-foreground text-xs uppercase tracking-wider">Код из Telegram-бота</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono bg-secondary/50 border-border/40 focus:border-primary/50 focus:shadow-[0_0_20px_-4px_hsl(var(--primary)/0.2)] transition-shadow"
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Введите 6-значный код, полученный от бота
                </p>
              </div>

              <Button type="submit" className="w-full rounded-full btn-shimmer" size="lg" disabled={loading || code.length !== 6}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Проверка...</> : 'Войти'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => { setStep('choose'); setCode(''); stopPolling(); }}
                >
                  Назад
                </Button>
                <Button asChild variant="link" size="sm" className="w-full" onClick={() => startPolling()}>
                  <a href={botLink} target="_blank" rel="noopener noreferrer">
                    Получить новый код
                  </a>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
