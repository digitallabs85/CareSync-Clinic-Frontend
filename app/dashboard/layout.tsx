"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppLoader from "../AppLoader";

const STAFF_ONLY_PATHS = [
  "/dashboard/demographic",
  "/dashboard/vitals",
  "/dashboard/onlineConsult",
  "/dashboard/pharmacy",
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isVideoCallRoute = pathname?.startsWith("/dashboard/video-call/");

  useEffect(() => {
    const staffToken = localStorage.getItem("user");
    const docToken = localStorage.getItem("doc_token");

    const currentIsDoctor = !!docToken;
    const currentIsStaff = !!staffToken && !currentIsDoctor;

    setIsStaff(currentIsStaff);

    if (!currentIsDoctor && !currentIsStaff) {
      router.replace("/sign-in");
      return;
    }

    setIsAuthorized(true);
  }, [router, pathname]);

  if (!isAuthorized) {
    return <AppLoader />; // ✅ same loader as page.tsx — feels like one continuous screen
  }

  return (
    <div className="flex min-h-screen">
      <main className={`flex-1 min-h-screen transition-all duration-300 pl-0`}>
        {children}
      </main>
    </div>
  );
}