"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export default function HomePage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    router.replace(user ? "/dashboard" : "/login");
  }, [router, user]);

  return <div className="min-h-screen bg-slate-50" />;
}
