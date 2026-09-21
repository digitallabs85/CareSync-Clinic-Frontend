// app/video-call/[vitalsId]/VideoCallClient.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  ILocalVideoTrack,
  ILocalAudioTrack,
  IAgoraRTCClient
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, CameraOff, AlertCircle, FileText } from "lucide-react";
import { apiService } from '@/app/_utils/apiService';
import { PatientPrescriptionModal } from './PatientPrescriptionModal';

interface VideoCallClientProps {
  vitalsId: string;
}

export default function VideoCallClient({ vitalsId }: VideoCallClientProps) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPrescriptionViewOpen, setIsPrescriptionViewOpen] = useState(false);

  const client = useRef<IAgoraRTCClient | null>(null);
  const initialized = useRef(false);
  const localAudioTrack = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrack = useRef<ILocalVideoTrack | null>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAppDestroyed = () => {
      localAudioTrack.current?.stop();
      localAudioTrack.current?.close();
      localVideoTrack.current?.stop();
      localVideoTrack.current?.close();
      client.current?.leave();
    };
    window.addEventListener('app-destroyed', handleAppDestroyed);
    return () => window.removeEventListener('app-destroyed', handleAppDestroyed);
  }, []);

  useEffect(() => {
    const anyModalOpen = isPrescriptionViewOpen;
    if (typeof window === 'undefined') return;
    if (anyModalOpen) {
      window.AndroidNative?.disablePullToRefresh?.();
    } else {
      window.AndroidNative?.enablePullToRefresh?.();
    }
  }, [isPrescriptionViewOpen]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initCall = async () => {
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) throw new Error("No auth token found. Please log in again.");

        const data = await apiService.getAgoraToken(vitalsId);

        client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        (window as any).__agoraClient = client.current;

        await client.current.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          data.channelName,
          data.token,
          data.uid
        );

        client.current.on("user-published", async (user, mediaType) => {
          try {
            await client.current!.subscribe(user, mediaType);
            if (mediaType === "video" && remoteRef.current) {
              user.videoTrack?.play(remoteRef.current);
            }
            if (mediaType === "audio") {
              user.audioTrack?.play();
            }
          } catch (subErr) {
            console.error("Subscription failed:", subErr);
          }
        });

        client.current.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video" && remoteRef.current) {
            remoteRef.current.innerHTML = '';
          }
        });

        try {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localAudioTrack.current = audioTrack;
          localVideoTrack.current = videoTrack;

          if (localRef.current) videoTrack.play(localRef.current);

          await client.current.publish([audioTrack, videoTrack]);
          setHasCamera(true);
        } catch (deviceErr: any) {
          console.warn("Camera/mic failed:", deviceErr.code);
          if (
            deviceErr.code === 'PERMISSION_DENIED' ||
            deviceErr.message?.includes('Permission denied') ||
            deviceErr.message?.includes('NotAllowedError')
          ) {
            setPermissionDenied(true);
            setHasCamera(false);
            setJoined(true);
            setLoading(false);
            return;
          }

          if (
            deviceErr.code === 'DEVICE_NOT_FOUND' ||
            deviceErr.message?.includes('NotFoundError')
          ) {
            try {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              localAudioTrack.current = audioTrack;
              await client.current!.publish([audioTrack]);
              setHasCamera(false);
            } catch {
              console.warn("No audio device — joined as listener");
              setHasCamera(false);
            }
          }
        }

        setJoined(true);
      } catch (err: any) {
        console.error("Video Call Error:", err);
        setError(err.message || "Failed to join call");
      } finally {
        setLoading(false);
      }
    };

    initCall();

    return () => {
      delete (window as any).__agoraClient;
      localAudioTrack.current?.stop();
      localAudioTrack.current?.close();
      localAudioTrack.current = null;
      localVideoTrack.current?.stop();
      localVideoTrack.current?.close();
      localVideoTrack.current = null;
      client.current?.leave();
      client.current = null;
    };
  }, [vitalsId]);

  const handleEndCall = async () => {
    localAudioTrack.current?.stop();
    localAudioTrack.current?.close();
    localVideoTrack.current?.stop();
    localVideoTrack.current?.close();
    client.current?.leave();
    try {
      await apiService.endCall(vitalsId, 'completed');
    } catch (err) {
      console.error('Failed to record end-call timestamp:', err);
    }
    window.location.href = '/dashboard/onlineConsult';
  };

  if (error) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 font-medium text-center">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} variant="secondary">Retry</Button>
          <Button onClick={handleEndCall} variant="destructive">Leave</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
      {isPrescriptionViewOpen && (
        <PatientPrescriptionModal
          onClose={() => setIsPrescriptionViewOpen(false)}
          vitalsId={vitalsId}
        />
      )}

      {loading && (
        <div className="z-50 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-white font-medium">Initializing secure connection...</p>
        </div>
      )}

      {permissionDenied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-500/90 text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          Camera & microphone blocked. Click the lock icon in your browser address bar to allow access, then reload.
        </div>
      )}

      <div ref={remoteRef} className="absolute inset-0 w-full h-full bg-slate-900" />

      {hasCamera ? (
        <div ref={localRef} className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-black rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10" />
      ) : (
        <div className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-slate-800 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10 flex items-center justify-center">
          <CameraOff className="h-8 w-8 text-slate-400" />
        </div>
      )}

      {joined && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          <Button
            onClick={async () => { if (localAudioTrack.current) { await localAudioTrack.current.setEnabled(!micOn); setMicOn(!micOn); } }}
            variant={micOn ? "secondary" : "destructive"}
            className="rounded-full h-13 w-13"
            disabled={!localAudioTrack.current}
          >
            {micOn ? <Mic className="max-[400px]:size-4" /> : <MicOff className="max-[400px]:size-4" />}
          </Button>

          <Button onClick={handleEndCall} className="bg-red-600 hover:bg-red-700 rounded-full h-16 w-16">
            <PhoneOff className="text-white max-[400px]:size-5" />
          </Button>

          <Button
            onClick={async () => { if (localVideoTrack.current) { await localVideoTrack.current.setEnabled(!videoOn); setVideoOn(!videoOn); } }}
            variant={videoOn ? "secondary" : "destructive"}
            className="rounded-full h-13 w-13"
            disabled={!localVideoTrack.current}
          >
            {videoOn ? <Video className="max-[400px]:size-4" /> : <VideoOff className="max-[400px]:size-4" />}
          </Button>

          <Button
            onClick={() => setIsPrescriptionViewOpen(true)}
            className="rounded-full h-13 w-13 bg-[#0297d6] hover:bg-[#0288c2] border-2 border-white/20"
          >
            <FileText size={18} className="max-[400px]:size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}