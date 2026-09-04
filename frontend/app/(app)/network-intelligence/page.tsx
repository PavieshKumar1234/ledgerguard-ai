'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Network,
  Users,
  Smartphone,
  Globe,
  Wallet,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from '@/components/shared/page-primitives';
import {
  networkEntities,
  networkEdges,
} from '@/lib/demo-data';

const typeIcons: Record<string, typeof Users> = {
  Customer: Users,
  Device: Smartphone,
  IP: Globe,
  Account: Wallet,
};

function riskColor(risk: number): string {
  if (risk > 80) return '#f43f5e';
  if (risk > 60) return '#f59e0b';
  if (risk > 40) return '#2b8eff';
  return '#22c55e';
}

const filterButtons = [
  { label: 'All Entities', icon: Network, type: 'All' },
  { label: 'Customers', icon: Users, type: 'Customer' },
  { label: 'Devices', icon: Smartphone, type: 'Device' },
  { label: 'IPs', icon: Globe, type: 'IP' },
  { label: 'Accounts', icon: Wallet, type: 'Account' },
];

const selectedEntity = networkEntities.find((e) => e.id === 'CUST-19384')!;

const entityIntelligence = [
  { label: 'Entity ID', value: selectedEntity.id },
  { label: 'Type', value: selectedEntity.type },
  { label: 'Risk Score', value: `${selectedEntity.risk} / 100` },
  { label: 'First Seen', value: '14 days ago' },
  { label: 'Last Seen', value: '2 min ago' },
  { label: 'Associated Accounts', value: '8' },
  { label: 'Transaction Count', value: '87' },
  { label: 'Financial Exposure', value: '₹4.85L' },
  { label: 'Geographic Activity', value: 'Mumbai, Pune' },
  { label: 'Related High-Risk Entities', value: '6' },
];

const relatedEntities = networkEdges
  .filter((e) => e.from === selectedEntity.id || e.to === selectedEntity.id)
  .map((e) => (e.from === selectedEntity.id ? e.to : e.from));

export default function NetworkIntelligencePage() {
  const [filter, setFilter] = useState('All');

  const visibleEntities = filter === 'All'
    ? networkEntities
    : networkEntities.filter((e) => e.type === filter);

  const visibleIds = new Set(visibleEntities.map((e) => e.id));
  const visibleEdges = networkEdges.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to)
  );

  return (
    <PageContainer>
      <PageHeader
        title="Network Intelligence"
        subtitle="Interactive entity relationship and fraud network analysis"
        icon={Network}
      />

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => {
          const Icon = btn.icon;
          const active = filter === btn.type;
          return (
            <button
              key={btn.label}
              onClick={() => setFilter(btn.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-tech rounded transition-colors ${
                active
                  ? 'bg-blue-500/10 text-lg-blue border border-blue-500/30'
                  : 'text-lg-muted border border-lg hover:text-white'
              }`}
            >
              <Icon size={12} />
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Network graph + Selected entity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          title="Fraud Network Graph"
          subtitle="Entity relationships — node color by risk score"
          className="lg:col-span-2"
          action={
            <span className="text-[10px] font-mono-tech text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-lg-pulse-soft" />
              LIVE
            </span>
          }
        >
          <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
            <svg
              viewBox="0 0 100 62.5"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Edges */}
              {visibleEdges.map((edge, i) => {
                const from = networkEntities.find((e) => e.id === edge.from);
                const to = networkEntities.find((e) => e.id === edge.to);
                if (!from || !to) return null;
                const highRisk = from.risk > 60 || to.risk > 60;
                return (
                  <line
                    key={i}
                    x1={from.x}
                    y1={from.y * 0.625}
                    x2={to.x}
                    y2={to.y * 0.625}
                    stroke={highRisk ? '#f43f5e' : '#2b3a4a'}
                    strokeWidth={highRisk ? 0.4 : 0.25}
                    strokeOpacity={highRisk ? 0.6 : 0.4}
                  />
                );
              })}
              {/* Nodes */}
              {visibleEntities.map((entity) => {
                const color = riskColor(entity.risk);
                const Icon = typeIcons[entity.type];
                const isSelected = entity.id === selectedEntity.id;
                return (
                  <g key={entity.id}>
                    {isSelected && (
                      <circle
                        cx={entity.x}
                        cy={entity.y * 0.625}
                        r={4}
                        fill="none"
                        stroke={color}
                        strokeWidth={0.3}
                        strokeOpacity={0.5}
                        className="animate-lg-pulse-soft"
                      />
                    )}
                    <circle
                      cx={entity.x}
                      cy={entity.y * 0.625}
                      r={2.2}
                      fill={color}
                      fillOpacity={0.8}
                      stroke={color}
                      strokeWidth={0.2}
                    />
                    <text
                      x={entity.x}
                      y={entity.y * 0.625 + 4.2}
                      textAnchor="middle"
                      fill="#6b7785"
                      fontSize="1.6"
                      fontFamily="monospace"
                    >
                      {entity.id}
                    </text>
                    <text
                      x={entity.x}
                      y={entity.y * 0.625 + 6.4}
                      textAnchor="middle"
                      fill="#4a5360"
                      fontSize="1.3"
                      fontFamily="monospace"
                    >
                      {entity.type} · {entity.risk}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono-tech">
            <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f43f5e' }} />Critical (&gt;80)</span>
            <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />High (&gt;60)</span>
            <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2b8eff' }} />Medium (&gt;40)</span>
            <span className="flex items-center gap-1.5 text-lg-muted"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />Low (&lt;40)</span>
          </div>
        </Card>

        <Card
          title="Selected Entity Intelligence"
          subtitle={`${selectedEntity.id} — ${selectedEntity.type}`}
          action={
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-tech border"
              style={{
                color: riskColor(selectedEntity.risk),
                borderColor: `${riskColor(selectedEntity.risk)}55`,
                backgroundColor: `${riskColor(selectedEntity.risk)}15`,
              }}
            >
              RISK {selectedEntity.risk}
            </span>
          }
        >
          <div className="space-y-2">
            {entityIntelligence.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between text-[11px] py-1.5 border-b border-lg/40"
              >
                <span className="text-lg-muted font-mono-tech">{item.label}</span>
                <span className="text-white font-mono-tech text-right">{item.value}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block mb-2">
              Related Entities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {relatedEntities.map((rid) => {
                const re = networkEntities.find((e) => e.id === rid);
                if (!re) return null;
                const Icon = typeIcons[re.type];
                return (
                  <span
                    key={rid}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-tech border"
                    style={{
                      color: riskColor(re.risk),
                      borderColor: `${riskColor(re.risk)}55`,
                      backgroundColor: `${riskColor(re.risk)}15`,
                    }}
                  >
                    <Icon size={9} />
                    {rid}
                  </span>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Suspicious Clusters */}
      <Card
        title="Suspicious Clusters"
        subtitle="AI-detected coordinated fraud networks"
        action={
          <span className="text-[10px] font-mono-tech text-lg-blue flex items-center gap-1">
            <ShieldAlert size={11} /> AI DETECTED
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-rose-400" />
              <span className="text-[11px] font-mono-tech text-rose-400 uppercase tracking-wider">Cluster #1</span>
            </div>
            <p className="text-[12px] text-white/80 leading-snug">
              7 shared devices, 14 accounts, coordinated fraud network detected in Mumbai
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono-tech text-lg-muted">
              <span className="flex items-center gap-1"><Smartphone size={10} /> 7 devices</span>
              <span className="flex items-center gap-1"><Users size={10} /> 14 accounts</span>
              <span className="flex items-center gap-1"><MapPin size={10} /> Mumbai</span>
            </div>
          </div>
          <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-[11px] font-mono-tech text-amber-400 uppercase tracking-wider">Cluster #2</span>
            </div>
            <p className="text-[12px] text-white/80 leading-snug">
              3 IP addresses linked to 9 accounts with overlapping refund patterns
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono-tech text-lg-muted">
              <span className="flex items-center gap-1"><Globe size={10} /> 3 IPs</span>
              <span className="flex items-center gap-1"><Users size={10} /> 9 accounts</span>
              <span className="flex items-center gap-1"><Clock size={10} /> Active 2h</span>
            </div>
          </div>
          <div className="p-3 rounded-md bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-blue-400" />
              <span className="text-[11px] font-mono-tech text-blue-400 uppercase tracking-wider">Cluster #3</span>
            </div>
            <p className="text-[12px] text-white/80 leading-snug">
              Synthetic identity cluster — 5 new accounts with matching device fingerprints
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono-tech text-lg-muted">
              <span className="flex items-center gap-1"><Users size={10} /> 5 accounts</span>
              <span className="flex items-center gap-1"><Smartphone size={10} /> 2 devices</span>
              <span className="flex items-center gap-1"><Clock size={10} /> 8 days</span>
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
