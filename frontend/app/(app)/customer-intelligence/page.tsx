'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  ShoppingCart,
  ShieldAlert,
  CreditCard,
  RotateCcw,
  User,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  RiskBadge,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from '@/components/shared/page-primitives';
import {
  customers,
  customerTimeline,
  formatINR,
} from '@/lib/demo-data';

const timelineIcons: Record<string, React.ReactNode> = {
  purchase: <ShoppingCart size={12} />,
  risk: <ShieldAlert size={12} />,
  chargeback: <CreditCard size={12} />,
  refund: <RotateCcw size={12} />,
};

const timelineColors: Record<string, string> = {
  purchase: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  risk: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  chargeback: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  refund: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

function riskLevel(score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function SearchBar() {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lg-muted" />
      <input
        type="text"
        placeholder="Search by Customer ID, Email, Phone, Account ID..."
        className="w-full bg-lg-surface border border-lg rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-white placeholder:text-lg-muted focus:outline-none focus:border-blue-500/30 transition-colors"
      />
    </div>
  );
}

function CustomerTable() {
  return (
    <Card title="Customer Directory" subtitle="All customers with risk scores and behavioral metrics">
      <TableContainer>
        <thead>
          <tr>
            <Th>Customer ID</Th>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Age (days)</Th>
            <Th>Volume</Th>
            <Th>Total Spend</Th>
            <Th>Refund %</Th>
            <Th>Chargeback %</Th>
            <Th>Risk</Th>
            <Th>LTV</Th>
            <Th>Location</Th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => (
            <motion.tr
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-lg/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <Td className="font-mono-tech text-white/80">{c.id}</Td>
              <Td className="text-white/80">{c.name}</Td>
              <Td className="font-mono-tech text-lg-muted">{c.email}</Td>
              <Td className="font-mono-tech text-lg-muted">{c.age}</Td>
              <Td className="font-mono-tech text-lg-muted">{c.volume}</Td>
              <Td className="font-mono-tech text-white">{formatINR(c.spend)}</Td>
              <Td className={`font-mono-tech ${c.refundRate > 10 ? 'text-rose-400' : 'text-lg-muted'}`}>{c.refundRate}%</Td>
              <Td className={`font-mono-tech ${c.chargebackRate > 5 ? 'text-rose-400' : 'text-lg-muted'}`}>{c.chargebackRate}%</Td>
              <Td><RiskBadge score={c.riskScore} level={riskLevel(c.riskScore)} /></Td>
              <Td className="font-mono-tech text-white">{formatINR(c.ltv)}</Td>
              <Td className="text-lg-muted">{c.location}</Td>
            </motion.tr>
          ))}
        </tbody>
      </TableContainer>
    </Card>
  );
}

function CustomerProfileCard() {
  const customer = customers.find((c) => c.id === 'CUST-19384')!;
  const fields = [
    { icon: <User size={11} />, label: 'Customer ID', value: customer.id },
    { icon: <User size={11} />, label: 'Name', value: customer.name },
    { icon: <Mail size={11} />, label: 'Email', value: customer.email },
    { icon: <Calendar size={11} />, label: 'Account Age', value: `${customer.age} days` },
    { icon: <Activity size={11} />, label: 'Transaction Volume', value: `${customer.volume}` },
    { icon: <TrendingUp size={11} />, label: 'Total Spend', value: formatINR(customer.spend) },
    { icon: <RotateCcw size={11} />, label: 'Refund Rate', value: `${customer.refundRate}%` },
    { icon: <CreditCard size={11} />, label: 'Chargeback Rate', value: `${customer.chargebackRate}%` },
    { icon: <ShieldAlert size={11} />, label: 'Risk Score', value: `${customer.riskScore}` },
    { icon: <TrendingUp size={11} />, label: 'LTV', value: formatINR(customer.ltv) },
    { icon: <MapPin size={11} />, label: 'Location', value: customer.location },
  ];
  return (
    <Card title="Customer Profile" subtitle="CUST-19384 — Rahul Verma (detailed view)">
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-lg-muted shrink-0">{f.icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider">{f.label}</div>
              <div className="text-[12px] font-mono-tech text-white truncate">{f.value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function CustomerTimelineCard() {
  return (
    <Card title="Customer Timeline" subtitle="Chronological activity for CUST-19384">
      <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
        {customerTimeline.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2.5 p-2.5 rounded-md hover:bg-white/[0.02] transition-colors"
          >
            <div className={`shrink-0 mt-0.5 p-1 rounded border ${timelineColors[t.type]}`}>
              {timelineIcons[t.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono-tech text-white">{t.event}</span>
                <span className="text-[10px] font-mono-tech text-lg-muted">{t.time}</span>
              </div>
              <p className="text-[11px] text-white/70 mt-0.5">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function CustomerRiskProfileCard() {
  const risks = [
    { label: 'Behavioral Risk', score: 88, color: 'bg-rose-500' },
    { label: 'Transaction Risk', score: 91, color: 'bg-rose-500' },
    { label: 'Refund Risk', score: 82, color: 'bg-amber-500' },
    { label: 'Chargeback Risk', score: 76, color: 'bg-amber-500' },
    { label: 'Network Risk', score: 87, color: 'bg-rose-500' },
  ];
  return (
    <Card title="Customer Risk Profile" subtitle="Multi-dimensional risk assessment for CUST-19384" action={<ShieldAlert size={14} className="text-rose-400" />}>
      <div className="space-y-3">
        {risks.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-lg-muted">{r.label}</span>
              <span className="font-mono-tech text-white">{r.score}/100</span>
            </div>
            <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${r.score}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`h-full rounded-full ${r.color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export default function CustomerIntelligencePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Customer Intelligence"
        subtitle="Customer risk profiles and behavioral analysis"
        icon={Users}
      />

      <SearchBar />

      <CustomerTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CustomerProfileCard />
        <CustomerRiskProfileCard />
      </div>

      <CustomerTimelineCard />
    </PageContainer>
  );
}
