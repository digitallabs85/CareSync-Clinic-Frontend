"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

interface WebcamPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const WebcamPhotoModal: React.FC<WebcamPhotoModalProps> = ({ isOpen, onClose, onCapture }) => {
  const webcamRef = useRef<Webcam>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [headerLabel, setHeaderLabel] = useState("Take Patient Photo");

  useEffect(() => {
  if (isOpen) {
    if (typeof window !== "undefined" && window.AndroidNative?.showCameraLoading) {
      window.AndroidNative.showCameraLoading();
    }
    // Decide header text based on what's in localStorage
    if (typeof window !== "undefined") {
      const docToken = localStorage.getItem("doc_token");
      setHeaderLabel(docToken ? "Take Your Photo" : "Take Patient Photo");
    }
    setPreview(null);
    setCameraReady(false);
  } else {
    if (typeof window !== "undefined" && window.AndroidNative?.hideCameraLoading) {
      window.AndroidNative.hideCameraLoading();
    }
  }
}, [isOpen]);

  // Show overlay when modal opens, hide when it closes
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined" && window.AndroidNative?.showCameraLoading) {
        window.AndroidNative.showCameraLoading();
      }
      setPreview(null);
      setCameraReady(false);
    } else {
      if (typeof window !== "undefined" && window.AndroidNative?.hideCameraLoading) {
        window.AndroidNative.hideCameraLoading();
      }
    }
  }, [isOpen]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setPreview(imageSrc);
  }, []);

  // ── FIX: Show overlay again when retaking ──
  const handleRetake = useCallback(() => {
    setPreview(null);
    // Show native overlay while camera re‑initialises
    if (typeof window !== "undefined" && window.AndroidNative?.showCameraLoading) {
      window.AndroidNative.showCameraLoading();
    }
  }, []);

  const handleUse = useCallback(() => {
    if (preview) {
      onCapture(preview);
      onClose();
    }
  }, [preview, onCapture, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 bg-black flex flex-col w-screen h-dvh touch-none">

      {preview ? (
        /* ── PREVIEW MODE ── */
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 bg-black/60 backdrop-blur-md shrink-0">
            <button
              onClick={handleRetake}
              className="w-10 h-10 rounded-full bg-white/15 border-none flex items-center justify-center text-white text-xl cursor-pointer"
            >
              ←
            </button>
            <span className="text-white font-bold text-base">Use this photo?</span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 border-none flex items-center justify-center text-white text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <div className="flex gap-3 px-5 pt-5 pb-10 bg-black/60 backdrop-blur-md shrink-0">
            <button
              onClick={handleRetake}
              className="flex-1 py-4 rounded-2xl border border-white/20 bg-transparent text-white font-semibold text-sm cursor-pointer"
            >
              ← Retake
            </button>
            <button
              onClick={handleUse}
              className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold text-sm cursor-pointer shadow-[0_4px_20px_rgba(34,197,94,0.4)]"
            >
              Use Photo ✓
            </button>
          </div>
        </div>
      ) : (
        /* ── LIVE CAMERA MODE ── */
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center px-5 py-4 bg-linear-to-b from-black/70 to-transparent">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 border-none flex items-center justify-center text-white text-xl cursor-pointer"
            >
              ←
            </button>
            <span className="text-white text-sm font-semibold ml-3">{headerLabel}</span>
          </div>

          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.92}
            videoConstraints={{ facingMode: 'user' }}
            onUserMedia={() => {
              setCameraReady(true);
              // Hide overlay when stream is ready
              if (typeof window !== "undefined" && window.AndroidNative?.hideCameraLoading) {
                window.AndroidNative.hideCameraLoading();
              }
            }}
            onUserMediaError={() => {
              setCameraReady(false);
              if (typeof window !== "undefined" && window.AndroidNative?.hideCameraLoading) {
                window.AndroidNative.hideCameraLoading();
              }
            }}
            className="w-full h-full object-cover block"
          />

          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center px-4 pt-5 pb-12 bg-linear-to-t from-black/70 to-transparent">
            <p className="text-white/60 text-xs mb-5">Tap to capture</p>
            <button
              onClick={handleCapture}
              disabled={!cameraReady}
              className={`w-19 h-19 rounded-full bg-white p-1.5 border-none transition-opacity ${cameraReady ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="w-full h-full rounded-full bg-[#0297d6]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};