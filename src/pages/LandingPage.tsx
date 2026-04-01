import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, BarChart3, Clock, CheckCircle2, 
  Star, TrendingUp, Zap,
  ArrowRight, ChevronRight, MousePointerClick,
  Bot
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import AnimatedBackground from '@/components/ui/animated-background';

const CountUpValue = ({ value, suffix = '' }: { value: string; suffix?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const num = parseInt(value) || 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || !num) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const duration = 800;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * num) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [num, suffix]);

  return <div ref={ref}>{value}{suffix}</div>;
};

const ScrollReveal = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate('/auth');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden relative" style={{ minHeight: '-webkit-fill-available' }}>
      <AnimatedBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold font-display tracking-tight text-foreground">
            DEAL<span className="text-primary">LINK</span>
          </span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Как работает</button>
            <button onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Преимущества</button>
          </div>
          <Button size="sm" onClick={goAuth} className="rounded-full px-5 btn-shimmer">
            Начать
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 md:pt-32 md:pb-24 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-8 w-[300px] h-[300px] md:w-[500px] md:h-[500px] border border-primary/8 rounded-full" style={{ animation: 'float1 20s ease-in-out infinite' }} />
          <div className="absolute top-32 right-16 w-[200px] h-[200px] md:w-[350px] md:h-[350px] border border-primary/4 rounded-full" style={{ animation: 'float2 25s ease-in-out infinite' }} />
        </div>
        
        <div className="max-w-5xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 text-primary text-xs font-medium mb-6 bg-primary/5">
              <Zap className="w-3.5 h-3.5" />
              Автоматизация подбора блогеров
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
              Лучшая платформа{' '}
              <span className="gradient-text-animated">бартерного</span>{' '}
              маркетинга для&nbsp;вашего бизнеса.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-lg mb-8 leading-relaxed">
              Подбор блогеров для селлеров маркетплейсов. 
              Автоматизация, контроль сделок и&nbsp;прозрачная аналитика&nbsp;— всё в&nbsp;одном месте.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="text-base px-8 h-12 gap-2 rounded-full font-semibold btn-shimmer" onClick={goAuth}>
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-full" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                Узнать больше
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 mt-12">
              {[
                { value: '500', suffix: '+', label: 'Блогеров' },
                { value: '15', suffix: ' мин', label: 'На подбор' },
                { value: '98', suffix: '%', label: 'Довольных' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl md:text-3xl font-bold font-display text-primary">
                    <CountUpValue value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Numbered Features */}
      <ScrollReveal>
        <section id="how" className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Ваш надёжный <span className="gradient-text">партнёр</span>{' '}
                в бартерном маркетинге.
              </h2>
              <p className="text-muted-foreground max-w-lg">
                DealLink объединяет и обеспечивает растущую экосистему 
                блогеров и селлеров маркетплейсов.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { num: '01', title: 'Подбор любого уровня сложности', desc: 'От микро-блогеров до крупных инфлюенсеров — найдём подходящего для вашего товара.', highlighted: false },
                { num: '02', title: 'Лучшие практики индустрии', desc: 'DealLink объединяет проверенных блогеров с рейтингом и историей выполненных сделок.', highlighted: true },
                { num: '03', title: 'Защита и гарантии', desc: 'Верификация блогеров, система отзывов и полный контроль каждого этапа сделки.', highlighted: false },
              ].map((f, idx) => (
                <div 
                  key={f.num} 
                  className={`p-6 rounded-2xl border transition-all duration-300 card-hover-lift ${
                    f.highlighted 
                      ? 'bg-primary text-primary-foreground border-primary shadow-glow' 
                      : 'border-border/30 bg-card/40 hover:border-border/50'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`text-sm font-bold font-display mb-4 ${f.highlighted ? 'text-primary-foreground/70' : 'text-primary'}`}>
                    {f.num}.
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 leading-snug">
                    {f.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${f.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {f.desc}
                  </p>
                  {f.highlighted && (
                    <button 
                      onClick={goAuth}
                      className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary-foreground underline underline-offset-4"
                    >
                      Узнать больше <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Analytics preview */}
      <ScrollReveal>
        <section className="py-16 px-4 border-y border-border/15">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border/20 bg-card/30 card-hover-lift">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <span className="text-sm text-muted-foreground">Средние просмотры</span>
                    </div>
                    <div className="text-3xl font-bold font-display">
                      <CountUpValue value="12450" />
                    </div>
                    <div className="text-xs text-primary mt-1">+45.5% к прошлому месяцу</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Переходы', value: '834', icon: MousePointerClick },
                      { label: 'Конверсия', value: '6.7%', icon: TrendingUp },
                    ].map(m => (
                      <div key={m.label} className="p-4 rounded-xl border border-border/20 bg-card/30 card-hover-lift">
                        <m.icon className="w-4 h-4 text-primary mb-2" />
                        <div className="text-xl font-bold font-display">{m.value}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  Надёжная платформа <span className="gradient-text">в любое время</span>.
                </h2>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  DealLink объединяет растущую экосистему блогеров и селлеров. 
                  Каждая сделка прозрачна, каждый результат измерим.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Полный контроль от поиска блогера до публикации контента. 
                  UTM-метки, аналитика просмотров и оценка эффективности.
                </p>
                <div className="flex gap-3 mt-6">
                  <Button className="rounded-full gap-2 btn-shimmer" onClick={goAuth}>
                    Узнать больше <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={goAuth}>
                    Задать вопрос
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Why DealLink */}
      <ScrollReveal>
        <section id="why" className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Почему <span className="gradient-text">DealLink</span></h2>
              <p className="text-muted-foreground">Ключевые преимущества перед ручным поиском</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Clock, title: 'В 10 раз быстрее', desc: '15 минут вместо дней на поиск и переписки' },
                { icon: Bot, title: 'Telegram-бот', desc: 'Автоматические уведомления и управление сделками' },
                { icon: Shield, title: 'Защита от мошенников', desc: 'Рейтинги, отзывы и верификация каждого блогера' },
                { icon: BarChart3, title: 'Аналитика', desc: 'UTM-метки, просмотры, клики — всё измеримо' },
                { icon: CheckCircle2, title: 'Контроль сделки', desc: 'Статусы: заказал, забрал, снял, опубликовал' },
                { icon: Star, title: 'Рейтинг блогеров', desc: 'Отзывы от реальных селлеров, история выполнений' },
              ].map((a, idx) => (
                <div
                  key={a.title}
                  className="p-5 rounded-xl border border-border/20 bg-card/30 group hover:border-primary/20 transition-all duration-300 card-hover-lift"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors icon-ring">
                    <a.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5 font-display">{a.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Reviews */}
      <ScrollReveal>
        <section className="py-16 px-4 border-y border-border/15 bg-card/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Селлеры уже используют <span className="gradient-text">DealLink</span></h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: 'Анна К.', role: 'Селлер WB', text: 'Раньше тратила 2 дня на поиск блогеров. Теперь — 10 минут. Сервис реально экономит время и нервы.' },
                { name: 'Дмитрий В.', role: 'Менеджер', text: 'Наконец-то можно видеть аналитику по каждому блогеру. UTM-метки и контроль статусов — это то, что нужно.' },
                { name: 'Мария С.', role: 'Селлер Ozon', text: 'Система отзывов спасает от мошенников. За 3 месяца ни одного проблемного блогера.' },
              ].map(r => (
                <div key={r.name} className="p-5 rounded-xl border border-border/20 bg-card/30 card-hover-lift">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-foreground/80">{r.text}</p>
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Final CTA */}
      <section className="py-20 px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" style={{ animation: 'float1 15s ease-in-out infinite' }} />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Начните подбирать блогеров<br />за <span className="gradient-text-animated">15 минут</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Бесплатная регистрация. Первый подбор — без ограничений.
          </p>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Button size="lg" className="text-base px-10 h-12 gap-2 rounded-full font-semibold btn-shimmer relative" onClick={goAuth}>
              Попробовать бесплатно
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-bold font-display text-foreground">DEAL<span className="text-primary">LINK</span></span>
          <span>&copy; {new Date().getFullYear()} DealLink. Все права защищены.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
