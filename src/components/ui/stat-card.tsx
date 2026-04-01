import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon: Icon, suffix = '', onClick }: StatCardProps) => {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const isNumeric = typeof value === 'number' || /^\d+$/.test(String(value));

  useEffect(() => {
    if (!isNumeric || numValue === 0) return;
    const duration = 600;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * numValue));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [numValue, isNumeric]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`glass-card card-hover-lift p-4 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Glow accent on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.06), transparent 60%)',
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center icon-ring">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold font-display tracking-tight" style={{ animation: 'countUp 0.4s ease-out' }}>
          {isNumeric ? displayed : value}{suffix}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
