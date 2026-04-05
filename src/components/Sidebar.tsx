"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import type { User } from "@/types";
import { getInitials } from "@/utils/helpers";

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  isOpen,
  onToggle,
}) => {
  const pathname = usePathname();
  const [showMobileButton, setShowMobileButton] = useState(true);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    const hideDelay = 2200;

    const setActive = () => {
      setShowMobileButton(true);
      if (hideTimeout) clearTimeout(hideTimeout);

      hideTimeout = setTimeout(() => {
        if (!isOpen) setShowMobileButton(false);
      }, hideDelay);
    };

    const events = [
      "scroll",
      "mousemove",
      "touchstart",
      "touchmove",
      "keydown",
    ];

    setActive();
    events.forEach((eventName) => {
      window.addEventListener(eventName, setActive, { passive: true });
    });

    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, setActive);
      });
    };
  }, [isOpen]);

  if (!user) return null;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "⊞" },
    { path: "/calendar", label: "Calendário", icon: "📅" },
    { path: "/register", label: "Registar horas", icon: "⏱" },
    ...(user.role === "admin"
      ? [
          {
            path: "/admin-overview",
            label: "Todos os estagiários",
            icon: "👥",
          },
          { path: "/admin-report", label: "Relatórios", icon: "📊" },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className={`fixed left-4 top-4 z-40 rounded-lg border border-slate-200 bg-white p-2 transition-all duration-300 hover:bg-slate-50 md:hidden ${
          showMobileButton || isOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 bottom-0 w-60 bg-navy text-white flex flex-col z-40 transform transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-sm font-bold">
            📋
          </div>
          <div>
            <div className="font-semibold">Davinci Board</div>
            <div className="text-xs text-white/40">Gestão de Activities</div>
          </div>
        </div>

        {/* User */}
        <div className="p-4">
          <button type="button" className="w-full text-left ">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-semibold">
                  {getInitials(user.name)}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-white/60 truncate uppercase">
                  {user.role}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onToggle()}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors ${
                  isActive
                    ? "bg-primary-500 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            <span>Terminar sessão</span>
          </button>
        </div>
      </nav>

      {/* Main margin on desktop */}
      <div className="hidden md:block w-60 flex-shrink-0" />
    </>
  );
};
