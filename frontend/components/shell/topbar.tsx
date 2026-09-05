"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Search,
  Bell,
  Command,
  ChevronDown,
  BrainCircuit,
} from "lucide-react";

import { systemStatus } from "@/lib/demo-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";

export function Topbar() {
  const [
    menu,
    setMenu,
  ] = useState<
    "profile" | "notifications" | null
  >(null);

  const ref =
    useRef<HTMLDivElement>(null);

  const router =
    useRouter();

  const {
    user,
    signOut,
  } = useAuth();

  const {
    notifications,
    markRead,
  } =
    useNotifications();

  const unread =
    notifications.filter(
      (n) => !n.read
    ).length;

  const displayName =
    user?.name ||
    "Arjun Kapoor";

  const role =
    user?.role ||
    "Merchant Admin";

  useEffect(() => {
    const close = (
      e: MouseEvent
    ) => {
      if (
        ref.current &&
        !ref.current.contains(
          e.target as Node
        )
      ) {
        setMenu(null);
      }
    };

    const escape = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        setMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      close
    );

    document.addEventListener(
      "keydown",
      escape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        close
      );

      document.removeEventListener(
        "keydown",
        escape
      );
    };
  }, []);

  return (
    <header
      ref={ref}
      className="h-14 border-b border-lg bg-lg-surface/80 lg-glass sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-4"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-lg-muted">
          Financial Intelligence
        </span>

        <span className="text-lg-dim">
          /
        </span>

        <span className="text-white font-medium">
          Command Center
        </span>
      </div>

      {/* System Status */}
      <div className="hidden xl:flex items-center gap-4 ml-2">
        {systemStatus.map(
          (s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 text-[10px] font-mono-tech text-lg-muted"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

              {s.label}
            </div>
          )
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto">
        <button
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-lg rounded-md text-[13px] text-lg-muted hover:border-blue-500/30 hover:bg-white/[0.05] transition-colors"
        >
          <Search size={14} />

          <span className="hidden sm:inline">
            Search transactions,
            cases, customers...
          </span>

          <span className="sm:hidden">
            Search...
          </span>

          <kbd className="ml-auto hidden sm:flex items-center gap-0.5 text-[10px] font-mono-tech text-lg-dim border border-lg px-1.5 py-0.5 rounded">
            <Command size={9} />
            K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">

        {/* AI Status */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono-tech text-lg-muted">
          <BrainCircuit
            size={14}
            className="text-lg-blue"
          />

          <span>
            AI ACTIVE
          </span>
        </div>

        {/* Notifications */}
        <button
          aria-label="Open notifications"
          onClick={() =>
            setMenu(
              menu ===
                "notifications"
                ? null
                : "notifications"
            )
          }
          className="relative p-1.5 text-lg-muted hover:text-white transition-colors"
        >
          <Bell size={16} />

          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-3 h-3 px-0.5 rounded-full bg-rose-500 text-[8px] text-white flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {/* User */}
        <button
          aria-haspopup="menu"
          aria-expanded={
            menu === "profile"
          }
          onClick={() =>
            setMenu(
              menu === "profile"
                ? null
                : "profile"
            )
          }
          className="flex items-center gap-2 pl-3 border-l border-lg"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-bold text-blue-300">
            {displayName
              .split(" ")
              .map(
                (part) =>
                  part[0]
              )
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="hidden lg:block text-left">
            <div className="text-[12px] text-white font-medium leading-tight">
              {displayName}
            </div>

            <div className="text-[10px] text-lg-dim font-mono-tech leading-tight">
              {role
                .replace(
                  "_",
                  " "
                )
                .toUpperCase()}
            </div>
          </div>

          <ChevronDown
            size={14}
            className="text-lg-dim hidden lg:block"
          />
        </button>
      </div>

      {/* Notifications Dropdown */}
      {menu ===
        "notifications" && (
        <div className="absolute right-16 top-12 w-[min(360px,calc(100vw-2rem))] bg-lg-surface border border-lg rounded-lg shadow-xl p-3 z-50">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white">
              Notifications
            </span>

            <Link
              href="/notifications"
              onClick={() =>
                setMenu(null)
              }
              className="text-[10px] text-lg-blue"
            >
              View all
            </Link>
          </div>

          {notifications
            .slice(0, 5)
            .map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  setMenu(null);
                  router.push(
                    n.route
                  );
                }}
                className="w-full text-left flex gap-2 p-2 border-b border-lg/50 hover:bg-blue-500/5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />

                <span>
                  <span className="block text-[11px] text-white">
                    {n.title}
                  </span>

                  <span className="block text-[10px] text-lg-muted">
                    {n.description}
                  </span>

                  <span className="block text-[9px] text-lg-dim mt-1">
                    {n.time}
                  </span>
                </span>
              </button>
            ))}

          {notifications.length ===
            0 && (
            <div className="py-5 text-center text-[11px] text-lg-muted">
              No new intelligence
            </div>
          )}
        </div>
      )}

      {/* Profile Dropdown */}
      {menu === "profile" && (
        <div
          role="menu"
          className="absolute right-4 top-12 w-60 bg-lg-surface border border-lg rounded-lg shadow-xl p-2 z-50"
        >
          {/* User Header */}
          <div className="px-2 py-3 border-b border-lg mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-bold text-blue-300">
                {displayName
                  .split(" ")
                  .map(
                    (part) =>
                      part[0]
                  )
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <div className="text-[12px] text-white font-semibold">
                  {displayName}
                </div>

                <div className="text-[10px] text-lg-muted">
                  {role}
                </div>
              </div>
            </div>
          </div>

          {/* Profile */}
          <Link
            role="menuitem"
            href="/profile"
            onClick={() =>
              setMenu(null)
            }
            className="block px-2 py-2 text-[11px] text-lg-muted hover:text-white hover:bg-blue-500/10 rounded"
          >
            Profile
          </Link>

          {/* Settings */}
          <Link
            role="menuitem"
            href="/settings"
            onClick={() =>
              setMenu(null)
            }
            className="block px-2 py-2 text-[11px] text-lg-muted hover:text-white hover:bg-blue-500/10 rounded"
          >
            Account Settings
          </Link>

          {/* Activity */}
          <Link
            role="menuitem"
            href="/audit-logs"
            onClick={() =>
              setMenu(null)
            }
            className="block px-2 py-2 text-[11px] text-lg-muted hover:text-white hover:bg-blue-500/10 rounded"
          >
            Activity
          </Link>

          {/* Logout */}
          <button
            role="menuitem"
            onClick={() => {
              setMenu(null);
              signOut();
            }}
            className="w-full text-left mt-1 border-t border-lg px-2 pt-2 pb-1 text-[11px] text-rose-400 hover:bg-rose-500/10 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}