'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between flex-wrap gap-3"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center justify-center">
            <Icon size={18} className="text-lg-blue" />
          </div>
        )}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-[12px] text-lg-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] font-mono-tech text-emerald-400">
          <ShieldCheck size={12} />
          ALL SYSTEMS OPERATIONAL
        </div>
      </div>
    </motion.div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`bg-lg-surface border border-lg rounded-lg p-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-[11px] text-lg-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  trend,
  color = '#2b8eff',
  isPercentage,
}: {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  color?: string;
  isPercentage?: boolean;
}) {
  const { formatINR } = require('@/lib/demo-data');
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-lg-surface border border-lg rounded-lg p-4 hover:border-blue-500/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-mono-tech text-lg-muted uppercase tracking-wider">{label}</span>
        <div
          className={`flex items-center gap-0.5 text-[11px] font-mono-tech ${
            trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">
        {isPercentage ? `${value}%` : formatINR(value)}
      </div>
    </motion.div>
  );
}

export function RiskBadge({ score, level }: { score: number; level: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-tech border ${colors[level] || colors.low}`}>
      {score}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Blocked: 'text-rose-400',
    Investigating: 'text-amber-400',
    Completed: 'text-emerald-400',
    Open: 'text-amber-400',
    Won: 'text-emerald-400',
    Lost: 'text-rose-400',
    Pending: 'text-blue-400',
    Active: 'text-emerald-400',
    Suspended: 'text-rose-400',
    Ready: 'text-emerald-400',
    Generating: 'text-amber-400',
    Scheduled: 'text-blue-400',
    Failed: 'text-rose-400',
    New: 'text-blue-400',
    Resolved: 'text-emerald-400',
    Escalated: 'text-rose-400',
    'Awaiting Review': 'text-amber-400',
    'False Positive': 'text-lg-muted',
    Running: 'text-amber-400',
    Waiting: 'text-blue-400',
    Success: 'text-emerald-400',
  };
  return (
    <span className={`text-[10px] font-mono-tech ${colors[status] || 'text-lg-muted'}`}>
      {status}
    </span>
  );
}

export function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-[11px]">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`pb-2 font-normal text-left text-lg-dim font-mono-tech border-b border-lg ${className}`}>{children}</th>;
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2 ${className}`}>{children}</td>;
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="p-4 lg:p-6 space-y-4 lg:space-y-5 max-w-[1920px] mx-auto">{children}</div>;
}
