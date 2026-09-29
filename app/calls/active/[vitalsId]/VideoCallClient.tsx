// app/video-call/[vitalsId]/VideoCallClient.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  ILocalVideoTrack,
  ILocalAudioTrack,
  IAgoraRTCClient
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, CameraOff, AlertCircle, FileText, Menu, ChevronDown } from "lucide-react";
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    const clinic = JSON.parse(localStorage.getItem('user') || '{}');
    window.location.href = clinic.isBifurcated ? '/dashboard/onlineConsult' : '/dashboard/pharmacy';
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050505]">
      {/* ================= Modals ================= */}
      {isPrescriptionViewOpen && (
        <PatientPrescriptionModal
          onClose={() => setIsPrescriptionViewOpen(false)}
          vitalsId={vitalsId}
        />
      )}

      {/* ================= Remote Video (Main Canvas) ================= */}
      <div className="relative flex-1 overflow-hidden bg-[#0A0A0A]">
        {/* The actual video element container */}
        <div
          ref={remoteRef}
          className="absolute inset-0 h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
        />

        {/* Loading / Waiting State */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] backdrop-blur-sm">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/10"></span>
              <Loader2 size={32} className="animate-spin text-skeuo-red" />
            </div>
            <p className="text-lg font-bold tracking-wide text-white">
              Initializing secure connection...
            </p>
          </div>
        )}
      </div>

      {/* ================= Permissions Blocked Alert ================= */}
      {permissionDenied && (
        <div className="absolute left-1/2 top-4 z-50 flex w-[90%] max-w-sm -translate-x-1/2 items-start gap-3 rounded-2xl bg-yellow-500/90 p-4 text-black shadow-2xl backdrop-blur-md">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">
            Camera & microphone blocked. Click the lock icon in your browser address bar to allow access, then reload.
          </p>
        </div>
      )}

      {/* ================= Local Video (PIP) ================= */}
      {/* Floating glass pane pushed to the bottom right corner */}
      <div className="absolute bottom-32 right-4 z-30 overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-2 ring-white/20 sm:bottom-8 sm:right-8 sm:rounded-3xl">
        {hasCamera ? (
          <div
            ref={localRef}
            className="h-44 w-32 bg-slate-800 sm:h-56 sm:w-40 [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
          />
        ) : (
          <div className="flex h-44 w-32 items-center justify-center bg-slate-800 sm:h-56 sm:w-40">
            <CameraOff className="h-8 w-8 text-white/30" />
          </div>
        )}
      </div>

      {/* ================= Top Left Actions Dropdown ================= */}
      {joined && (
        <div className="absolute left-4 top-6 z-40 sm:left-6 sm:top-8">
          {/* Dropdown Trigger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="group flex items-center gap-2.5 rounded-2xl bg-black/40 p-2 pr-4 backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-black/60 hover:ring-white/30"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white/20">
              <Menu size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              Actions
            </span>
            <ChevronDown
              size={14}
              className={`ml-1 text-white/50 transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-black/60 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-fade-in">
              <button
                onClick={() => {
                  setIsPrescriptionViewOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/10"
              >
                <FileText size={16} className="shrink-0 text-skeuo-red" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">View Prescription</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= Bottom Control Dock ================= */}
      {joined && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-[2.5rem] bg-black/50 px-6 py-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 sm:bottom-8 sm:gap-6 sm:px-8">

          {/* Toggle Mic */}
          <button
            onClick={async () => {
              if (localAudioTrack.current) {
                await localAudioTrack.current.setEnabled(!micOn);
                setMicOn(!micOn);
              }
            }}
            disabled={!localAudioTrack.current}
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all disabled:opacity-50 ${micOn
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-white text-skeuo-text shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              }`}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={22} className="text-rose-500" />}
          </button>

          {/* End Call (Hero Button) */}
          <button
            onClick={handleEndCall}
            className="group relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-skeuo-red text-white shadow-[0_8px_30px_rgba(220,38,38,0.4)] transition-all hover:bg-rose-700 hover:shadow-[0_8px_40px_rgba(220,38,38,0.6)]"
          >
            <div className="absolute inset-0 rounded-full border border-white/20"></div>
            <PhoneOff size={28} className="transition-transform group-hover:scale-110" />
          </button>

          {/* Toggle Cam */}
          <button
            onClick={async () => {
              if (localVideoTrack.current) {
                await localVideoTrack.current.setEnabled(!videoOn);
                setVideoOn(!videoOn);
              }
            }}
            disabled={!localVideoTrack.current}
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all disabled:opacity-50 ${videoOn
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-white text-skeuo-text shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              }`}
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={22} className="text-rose-500" />}
          </button>
        </div>
      )}

      {/* ================= Close Menu Overlay (Invisible) ================= */}
      {/* Clicking anywhere else on the screen will close the dropdown menu */}
      {isMenuOpen && (
        <div
          className="absolute inset-0 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}