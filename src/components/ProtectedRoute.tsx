"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return <>{children}</>;
};
