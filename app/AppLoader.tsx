export default function AppLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0296d6] border-t-transparent"></div>
        <p className="text-gray-400 text-sm animate-pulse font-medium">
          Loading Clinic..
        </p>
      </div>
    </div>
  );
}