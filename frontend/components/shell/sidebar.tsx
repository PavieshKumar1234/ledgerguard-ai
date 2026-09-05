'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  Search,
  Bell,
  TrendingUp,
  FileWarning,
  Network,
  BrainCircuit,
  Cpu,
  BarChart3,
  Users,
  Smartphone,
  FileText,
  UserCog,
  ScrollText,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { navItems } from '@/lib/demo-data';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  Search,
  Bell,
  TrendingUp,
  FileWarning,
  Network,
  BrainCircuit,
  Cpu,
  BarChart3,
  Users,
  Smartphone,
  FileText,
  UserCog,
  ScrollText,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[60px] lg:w-[240px] shrink-0 border-r border-lg bg-lg-surface flex flex-col h-screen sticky top-0 z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-3 lg:px-5 border-b border-lg shrink-0">
        <Link href="/overview" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-lg-blue" strokeWidth={1.5} />
          </div>
          <span className="hidden lg:block text-sm font-bold tracking-tight text-white">
            LEDGER<span className="text-lg-blue">GUARD</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {navItems.map((item, i) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            >
              <Link
                href={item.path}
                className={`w-full flex items-center gap-3 px-3 lg:px-5 py-2 text-[13px] font-medium relative group transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-blue-500/[0.07] border border-blue-500/30'
                    : 'text-lg-muted hover:text-white hover:bg-white/[0.02] border border-transparent'
                }`}
                style={
                  isActive
                    ? { boxShadow: '0 0 12px rgba(43,142,255,0.12), inset 0 0 8px rgba(43,142,255,0.04)' }
                    : undefined
                }
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-lg-blue" />
                )}
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-lg-blue' : 'text-lg-muted group-hover:text-white'
                  }`}
                />
                <span className={`hidden lg:block transition-colors duration-200 ${
                  isActive ? 'text-white' : ''
                }`}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="px-3 lg:px-5 py-3 border-t border-lg shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono-tech text-lg-dim">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-lg-pulse-soft" />
          ALL SYSTEMS OPERATIONAL
        </div>
        <div className="lg:hidden flex justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-lg-pulse-soft" />
        </div>
      </div>
    </aside>
  );
}
