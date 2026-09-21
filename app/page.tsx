"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLoader from "./AppLoader";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const staffToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const docToken = typeof window !== 'undefined' ? localStorage.getItem("doc_token") : null;

    if (docToken) {
      router.replace("/dashboard/consultation");
    } else if (staffToken) {
      router.replace("/dashboard/demographic");
    } else {
      router.replace("/sign-in");
    }
  }, [router]);

  return <AppLoader />;
}