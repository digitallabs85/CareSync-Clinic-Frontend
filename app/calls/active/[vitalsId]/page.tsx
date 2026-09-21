//app/dashboard/video-call/[vitalsid]/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const VideoCallClient = dynamic(() => import('./VideoCallClient'), {
  ssr: false,
  loading: () => (
    <div className="h-dvh w-full bg-slate-950 flex items-center justify-center">
      <p className="text-white">Loading Video Engine...</p>
    </div>
  )
});

export default function Page({ params }: { params: Promise<{ vitalsId: string }> }) {
  const resolvedParams = React.use(params);

  return (
    <main>
      <VideoCallClient vitalsId={resolvedParams.vitalsId} />
    </main>
  );
}