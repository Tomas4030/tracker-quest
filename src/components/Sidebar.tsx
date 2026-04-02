"use client";

import React from "react";
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

  if (!user) return null;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "⊞" },
    { path: "/calendar", label: "Calendário", icon: "🗓" },
    
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
        className="fixed top-4 left-4 z-40 md:hidden bg-white border border-slate-200 rounded-lg p-2 hover:bg-slate-50"
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
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-white/50">
              {user.role === "admin" ? "Administrador" : "Estagiário"}
            </div>
          </div>
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
