export default function AppLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {/* 
        Inline style for the native indeterminate progress bar animation 
        (Moves from left to right smoothly like Flutter's LinearProgressIndicator)
      */}
      <style>{`
        @keyframes indeterminate-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-progress {
          animation: indeterminate-progress 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* Exact screen center, same as the native splash */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="/logo.png" 
          alt="Clinic Logo" 
          className="w-[200px] object-contain pointer-events-none select-none" 
        />
      </div>

      {/* Loader sits below and never moves the logo */}
      <div className="absolute bottom-[90px] left-0 right-0 flex flex-col items-center justify-center">
        
        {/* Linear Progress Bar (Width 180px to match Flutter) */}
        <div className="relative h-1 w-[180px] overflow-hidden rounded-full bg-slate-100">
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#0297d6] animate-progress" />
        </div>
        
        {/* Status Text */}
        <p className="mt-3 text-sm font-medium tracking-wide text-slate-500 animate-pulse">
          Connecting...
        </p>
        
      </div>
    </div>
  );
}