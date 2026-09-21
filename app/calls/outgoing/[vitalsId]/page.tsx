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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16">
            <div className="flex flex-col items-center gap-4 mt-20">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-700 text-4xl font-semibold">
                    <Stethoscope size={40} />
                </div>
                <h1 className="text-2xl font-medium">{doctorName}</h1>
                <p className="text-slate-400 animate-pulse">
                    {status === "ringing" ? "Calling..." : message}
                </p>
            </div>

            {status === "ringing" && (
                <button
                    onClick={handleCancel}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600"
                >
                    <PhoneOff size={28} />
                </button>
            )}
        </div>
    );
}