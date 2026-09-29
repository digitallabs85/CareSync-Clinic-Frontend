"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppLoader from "../AppLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/sign-in");
      return;
    }

    setIsAuthorized(true);
  }, [router, pathname]);

  if (!isAuthorized || !minTimeElapsed) {
    return <AppLoader />;
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-h-screen transition-all duration-300 pl-0">
        {children}
      </main>
    </div>
  );
}