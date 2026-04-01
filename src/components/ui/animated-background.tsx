const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)',
          top: '10%',
          right: '10%',
          animation: 'float1 20s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary-glow)), transparent 70%)',
          bottom: '15%',
          left: '5%',
          animation: 'float2 25s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full opacity-[0.025]"
        style={{
          background: 'radial-gradient(circle, hsl(82 80% 55%), transparent 70%)',
          top: '50%',
          left: '40%',
          animation: 'float3 30s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
