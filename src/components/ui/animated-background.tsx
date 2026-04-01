import { forwardRef, useState, useEffect } from 'react';

const AnimatedBackground = forwardRef<HTMLDivElement>((_, ref) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer heavy animated blobs until after first paint (mobile-safe)
    let timer: number | null = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(
        () => setVisible(true),
      );

      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    timer = window.setTimeout(() => setVisible(true), 200);

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)',
          top: '10%',
          right: '10%',
          animation: 'float1 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary-glow)), transparent 70%)',
          bottom: '15%',
          left: '5%',
          animation: 'float2 25s ease-in-out infinite',
        }}
      />
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
