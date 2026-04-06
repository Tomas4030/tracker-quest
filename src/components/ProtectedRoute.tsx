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
  const refreshUser = useAppStore((state) => state.refreshUser);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    let isActive = true;
    const syncSession = async () => {
      try {
        await refreshUser();
      } catch {
        // On refresh failure we fall back to login.
      } finally {
        if (isActive) {
          setIsCheckingSession(false);
        }
      }
    };

    syncSession();

    return () => {
      isActive = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (!isCheckingSession && !user) {
      router.replace("/login");
    }
  }, [isCheckingSession, router, user]);

  if (!isMounted || isCheckingSession) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return <>{children}</>;
};
