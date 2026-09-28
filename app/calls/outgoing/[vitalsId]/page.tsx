"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PhoneOff, Stethoscope } from "lucide-react";
import { apiService } from "@/app/_utils/apiService";

export default function OutgoingCallPage() {
    const { vitalsId } = useParams<{ vitalsId: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();

    const doctorId = searchParams.get("doctorId");
    const doctorName = searchParams.get("doctorName") || "Doctor";
    const patientId = searchParams.get("patientId");
    const patientToken = searchParams.get("patientToken");

    const [status, setStatus] = useState<"ringing" | "ended">("ringing");
    const [message, setMessage] = useState("");
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const alertedRef = useRef(false);

    useEffect(() => {
        if (!vitalsId || !doctorId || alertedRef.current) return;
        alertedRef.current = true;

        const safeVitalsId = vitalsId;
        const safeDoctorId = doctorId;

        async function startCall() {
            try {
                await apiService.alertDoctor(safeDoctorId, safeVitalsId);
                startPolling();
            } catch (err: any) {
                setStatus("ended");
                setMessage(err.message || "Failed to reach doctor");
                setTimeout(() => router.replace("/dashboard/onlineConsult"), 3000);
            }
        }

        function startPolling() {
            timeoutRef.current = setTimeout(() => {
                if (pollRef.current) clearInterval(pollRef.current);
                apiService.endCall(safeVitalsId, "doctor_not_responding").catch(() => { });
                setStatus("ended");
                setMessage("Doctor did not respond in time.");
                setTimeout(() => router.replace("/dashboard/onlineConsult"), 3000);
            }, 120000);

            pollRef.current = setInterval(async () => {
                try {
                    const data = await apiService.getCallStatus(safeVitalsId);
                    if (!data?.status) return;

                    if (data.status === "accepted") {
                        cleanup();
                        const query = new URLSearchParams();
                        if (patientId) query.set("patientId", patientId);
                        if (patientToken) query.set("patientToken", patientToken);
                        router.replace(`/calls/active/${safeVitalsId}?${query.toString()}`);
                    } else if (data.status === "declined_by_doctor") {
                        cleanup();
                        setStatus("ended");
                        setMessage("Doctor declined the call.");
                        setTimeout(() => router.replace("/dashboard/onlineConsult"), 3000);
                    } else if (data.status === "doctor_not_responding") {
                        cleanup();
                        setStatus("ended");
                        setMessage("Doctor did not respond in time.");
                        setTimeout(() => router.replace("/dashboard/onlineConsult"), 3000);
                    }
                } catch {
                    // silent — retry next tick
                }
            }, 3500);
        }

        function cleanup() {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }

        startCall();

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [vitalsId, doctorId]);

    async function handleCancel() {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        try {
            await apiService.endCall(vitalsId, "declined_by_patient");
        } catch { }
        router.replace("/dashboard/onlineConsult");
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-slate-900 text-white">

            {/* Background ambient glow for outgoing call */}
            <div className="absolute inset-0 bg-sky-500/10 opacity-60 mix-blend-screen transition-opacity duration-1000 animate-pulse" />

            {/* Top Section: Doctor Info & Radar Animation */}
            <div className="relative z-10 mt-24 flex flex-col items-center gap-6">
                <div className="relative">
                    {/* Pulsing rings behind avatar */}
                    <div className="absolute inset-0 animate-ping rounded-full bg-white/10 opacity-75 [animation-duration:2s]" />
                    <div className="absolute -inset-4 animate-ping rounded-full bg-white/5 opacity-50 [animation-delay:0.5s] [animation-duration:2s]" />

                    {/* Avatar container */}
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 text-5xl font-black text-slate-300 shadow-2xl">
                        <Stethoscope size={48} className="text-white/80" />
                    </div>
                </div>

                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white shadow-sm">
                        {doctorName}
                    </h1>
                    <p className="animate-pulse text-sm font-medium uppercase tracking-widest text-slate-400">
                        {status === "ringing" ? "Calling..." : message}
                    </p>
                </div>
            </div>

            {/* Bottom Section: Cancel Action */}
            <div className="relative z-10 flex w-full max-w-sm justify-center px-6 pb-16">
                {status === "ringing" && (
                    <button
                        onClick={handleCancel}
                        className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-rose-600 text-white shadow-[0_8px_30px_rgba(225,29,72,0.3)] transition-all hover:scale-105 hover:bg-rose-700 hover:shadow-[0_8px_40px_rgba(225,29,72,0.5)]"
                    >
                        <div className="absolute inset-0 rounded-full border border-white/20"></div>
                        <PhoneOff size={32} className="transition-transform group-hover:scale-110" />
                    </button>
                )}
            </div>
        </div>
    );
}