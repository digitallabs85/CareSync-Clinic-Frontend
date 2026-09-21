export const NoRefreshScrollArea = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div
    className={`${className} max-w-6xl w-full`}>
    {children}
  </div>
);