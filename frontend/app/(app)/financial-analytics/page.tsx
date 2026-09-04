'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, DollarSign, Percent } from 'lucide-react';
import {
  PageHeader,
  Card,
  StatCard,
  PageContainer,
} from '@/components/shared/page-primitives';
import {
  financialAnalyticsData,
  lossBreakdown,
  formatINR,
} from '@/lib/demo-data';

const tooltipStyle = {
  backgroundColor: '#0d1117',
  border: '1px solid #1a2029',
  borderRadius: '6px',
  fontSize: '12px',
};

function StatGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatCard label="Revenue Protected" value={48200000} change={12.4} trend="up" color="#2b8eff" />
      <StatCard label="Revenue Recovered" value={31200000} change={18.7} trend="up" color="#22c55e" />
      <StatCard label="Revenue Lost" value={5400000} change={-8.2} trend="down" color="#f43f5e" />
      <StatCard label="Fraud Loss" value={2400000} change={-5.3} trend="down" color="#f43f5e" />
      <StatCard label="Chargeback Loss" value={1800000} change={-3.1} trend="down" color="#f59e0b" />
      <StatCard label="Refund Loss" value={1200000} change={2.4} trend="up" color="#a855f7" />
    </div>
  );
}

function RevenueTrendChart() {
  return (
    <Card title="Revenue Trend" subtitle="Protected, recovered and lost revenue over time (₹L)" action={<TrendingUp size={14} className="text-lg-blue" />}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={financialAnalyticsData}>
          <defs>
            <linearGradient id="protectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b8eff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2b8eff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2029" vertical={false} />
          <XAxis dataKey="month" stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6b7785' }} />
          <Area type="monotone" dataKey="protected" stroke="#2b8eff" strokeWidth={1.5} fill="url(#protectedGrad)" />
          <Area type="monotone" dataKey="recovered" stroke="#22c55e" strokeWidth={1.5} fill="url(#recoveredGrad)" />
          <Area type="monotone" dataKey="lost" stroke="#f43f5e" strokeWidth={1.5} fill="url(#lostGrad)" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px] font-mono-tech">
        <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-0.5 bg-blue-500" />Protected</span>
        <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-0.5 bg-emerald-500" />Recovered</span>
        <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-0.5 bg-rose-500" />Lost</span>
      </div>
    </Card>
  );
}

function LossBreakdownChart() {
  return (
    <Card title="Loss Breakdown" subtitle="Distribution of financial losses by category" action={<PieIcon size={14} className="text-amber-400" />}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={lossBreakdown}
            dataKey="value"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {lossBreakdown.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {lossBreakdown.map((l) => (
          <div key={l.category} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-lg-muted">{l.category}</span>
            <span className="text-white font-mono-tech ml-auto">{formatINR(l.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RoiAnalysisCard() {
  const rows = [
    { label: 'Financial Losses Prevented', value: formatINR(48200000), color: 'text-blue-400' },
    { label: 'Financial Losses Recovered', value: formatINR(31200000), color: 'text-emerald-400' },
    { label: 'Operational Cost', value: formatINR(2800000), color: 'text-amber-400' },
    { label: 'Platform Impact', value: formatINR(850000), color: 'text-purple-400' },
    { label: 'Net Benefit', value: formatINR(75800000), color: 'text-emerald-400', highlight: true },
    { label: 'ROI', value: '2,714%', color: 'text-emerald-400', highlight: true },
  ];
  return (
    <Card title="ROI Analysis" subtitle="Return on investment for LedgerGuard platform" action={<Percent size={14} className="text-emerald-400" />}>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center justify-between text-[11px] py-1.5 px-2 rounded ${
              r.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-lg-muted">{r.label}</span>
            <span className={`font-mono-tech font-bold ${r.color}`}>{r.value}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function RecoveryTrendChart() {
  return (
    <Card title="Recovery Trend" subtitle="Recovered revenue over time (₹L)" action={<TrendingUp size={14} className="text-emerald-400" />}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={financialAnalyticsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2029" vertical={false} />
          <XAxis dataKey="month" stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6b7785' }} />
          <Line type="monotone" dataKey="recovered" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function FinancialAnalyticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Financial Analytics"
        subtitle="Revenue protection, loss analysis and ROI"
        icon={BarChart3}
      />

      <StatGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart />
        </div>
        <LossBreakdownChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RoiAnalysisCard />
        <RecoveryTrendChart />
      </div>
    </PageContainer>
  );
}
