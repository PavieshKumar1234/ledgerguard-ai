'use client';

import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Sparkles,
  FileSearch,
  ArrowLeftRight,
  ArrowUpRight,
  StickyNote,
  FileText,
  Send,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  StatusBadge,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from '@/components/shared/page-primitives';
import {
  aiCopilotSuggestions,
  aiAgentActivity,
} from '@/lib/demo-data';

const primaryFactors = [
  'Transaction velocity 340% above baseline',
  'Device DEV-8201 linked to 14 accounts',
  '3 prior chargebacks in 30 days',
  'Geo mismatch: card issued in Delhi, txn in Mumbai',
];

const evidenceList = [
  'Velocity anomaly: 12 txns in 3 minutes',
  'Shared device fingerprint: DEV-8201',
  'IP reputation: 7 high-risk flags',
  'Customer history: 8 refunds, 3 chargebacks',
];

const relatedTransactions = ['TXN-82931', 'TXN-82929', 'TXN-82885', 'TXN-82855'];

const similarCases = [
  { id: 'CASE-10465', similarity: 94 },
  { id: 'CASE-10452', similarity: 81 },
  { id: 'CASE-10430', similarity: 76 },
];

const aiActions = [
  { label: 'Create Investigation', icon: FileSearch },
  { label: 'Generate Evidence', icon: Sparkles },
  { label: 'Show Transactions', icon: ArrowLeftRight },
  { label: 'Escalate', icon: ArrowUpRight },
  { label: 'Add Note', icon: StickyNote },
  { label: 'Generate Report', icon: FileText },
];

export default function AiRiskCopilotPage() {
  return (
    <PageContainer>
      <PageHeader
        title="LedgerGuard Intelligence"
        subtitle="AI-powered risk investigation and analysis"
        icon={BrainCircuit}
      />

      {/* AI status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-lg-pulse-soft" />
          <span className="text-[11px] font-mono-tech text-emerald-400 tracking-wider">AI ACTIVE</span>
        </div>
        <span className="text-[10px] font-mono-tech text-lg-muted">
          Model: XGBoost · Context: 1,420 cases
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: conversation */}
        <div className="space-y-4">
          {/* Suggested prompts */}
          <Card title="Suggested Investigations" subtitle="Click a prompt to start an AI analysis">
            <div className="flex flex-wrap gap-2">
              {aiCopilotSuggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-2.5 py-1.5 text-[11px] font-mono-tech rounded text-lg-muted border border-lg hover:text-white hover:border-lg-dim hover:bg-white/[0.02] transition-colors"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </Card>

          {/* Conversation area */}
          <Card
            title="Investigation: TXN-82931"
            subtitle="AI response with structured intelligence"
            action={
              <span className="text-[10px] font-mono-tech text-lg-blue flex items-center gap-1">
                <Sparkles size={11} /> AI ANALYZED
              </span>
            }
          >
            <div className="space-y-3">
              {/* User prompt */}
              <div className="flex justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[12px] text-white/90">
                  Why was TXN-82931 flagged?
                </div>
              </div>

              {/* AI response */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-2"
              >
                <div className="shrink-0 w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <BrainCircuit size={14} className="text-lg-blue" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[12px] text-white/80 leading-relaxed">
                    TXN-82931 was flagged due to a combination of velocity, device, and behavioral anomalies. The transaction scored 87/100 on the XGBoost risk model, driven primarily by network and velocity features.
                  </p>

                  {/* Structured intelligence */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-md bg-rose-500/5 border border-rose-500/20">
                      <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block">Risk Score</span>
                      <span className="text-lg font-bold text-rose-400">87</span>
                      <span className="text-[10px] font-mono-tech text-lg-muted"> / 100</span>
                    </div>
                    <div className="p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block">Confidence</span>
                      <span className="text-lg font-bold text-emerald-400">94%</span>
                    </div>
                  </div>

                  {/* Primary factors */}
                  <div>
                    <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block mb-1.5">Primary Factors</span>
                    <ul className="space-y-1">
                      {primaryFactors.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-white/70">
                          <span className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidence */}
                  <div>
                    <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block mb-1.5">Evidence</span>
                    <ul className="space-y-1">
                      {evidenceList.map((e) => (
                        <li key={e} className="flex items-start gap-2 text-[12px] text-white/70">
                          <CheckCircle2 size={11} className="text-emerald-400 mt-0.5 shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Related transactions */}
                  <div>
                    <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block mb-1.5">Related Transactions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {relatedTransactions.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono-tech text-lg-blue border border-blue-500/20 bg-blue-500/5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Similar cases */}
                  <div>
                    <span className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider block mb-1.5">Similar Cases</span>
                    <div className="space-y-1">
                      {similarCases.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-[11px] py-1 border-b border-lg/40">
                          <span className="font-mono-tech text-white/80">{c.id}</span>
                          <span className="font-mono-tech text-emerald-400">{c.similarity}% match</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended action */}
                  <div className="p-2.5 rounded-md bg-blue-500/5 border border-blue-500/20">
                    <span className="text-[10px] font-mono-tech text-lg-blue uppercase tracking-wider block mb-1">Recommended Action</span>
                    <span className="text-[12px] text-white/80">Decline transaction and escalate to CASE-10482. Enable enhanced velocity rules for Electronics category.</span>
                  </div>

                  {/* Financial impact */}
                  <div className="p-2.5 rounded-md bg-amber-500/5 border border-amber-500/20">
                    <span className="text-[10px] font-mono-tech text-amber-400 uppercase tracking-wider block mb-1">Financial Impact</span>
                    <span className="text-[12px] text-white/80">₹4.25L direct exposure · ₹12.5L network-wide potential if unchecked · ₹3.2L recoverable.</span>
                  </div>
                </div>
              </motion.div>

              {/* AI actions row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-lg/50">
                {aiActions.map((a) => (
                  <button
                    key={a.label}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono-tech rounded text-lg-muted border border-lg hover:text-white hover:border-lg-dim transition-colors"
                  >
                    <a.icon size={12} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: AI agent activity */}
        <div className="space-y-4">
          <Card
            title="AI Agent Activity"
            subtitle="Autonomous agent task queue"
            action={
              <span className="text-[10px] font-mono-tech text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-lg-pulse-soft" />
                RUNNING
              </span>
            }
          >
            <TableContainer>
              <thead>
                <tr>
                  <Th>Agent</Th>
                  <Th>Task</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Confidence</Th>
                  <Th className="text-right">Timestamp</Th>
                </tr>
              </thead>
              <tbody>
                {aiAgentActivity.map((a, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-lg/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <Td>
                      <span className="flex items-center gap-1.5 text-white/80">
                        {a.agent === 'Detection Agent' && <ShieldAlert size={11} className="text-rose-400" />}
                        {a.agent === 'Investigation Agent' && <FileSearch size={11} className="text-amber-400" />}
                        {a.agent === 'Recovery Agent' && <ArrowUpRight size={11} className="text-emerald-400" />}
                        {a.agent === 'Evidence Agent' && <Sparkles size={11} className="text-blue-400" />}
                        {a.agent === 'Policy Agent' && <StickyNote size={11} className="text-purple-400" />}
                        {a.agent === 'Analyst Copilot' && <BrainCircuit size={11} className="text-cyan-400" />}
                        {a.agent}
                      </span>
                    </Td>
                    <Td className="text-white/70">{a.task}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                    <Td className="text-right">
                      {a.confidence > 0 ? (
                        <span className={`text-[10px] font-mono-tech ${
                          a.confidence >= 90 ? 'text-emerald-400' : a.confidence >= 80 ? 'text-amber-400' : 'text-lg-muted'
                        }`}>
                          {a.confidence}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono-tech text-lg-muted">—</span>
                      )}
                    </Td>
                    <Td className="text-right font-mono-tech text-lg-muted">{a.timestamp}</Td>
                  </motion.tr>
                ))}
              </tbody>
            </TableContainer>
          </Card>

          {/* Quick prompt input */}
          <Card title="Ask LedgerGuard Intelligence" subtitle="Natural language risk investigation">
            <div className="flex items-center gap-2 p-2 rounded-md bg-white/[0.02] border border-lg">
              <input
                type="text"
                placeholder="e.g. Summarize today's risk exposure..."
                className="flex-1 bg-transparent text-[12px] text-white placeholder:text-lg-muted outline-none"
              />
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono-tech rounded bg-blue-500/10 text-lg-blue border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                <Send size={12} />
                Ask
              </button>
            </div>
            <p className="text-[10px] font-mono-tech text-lg-muted mt-2">
              AI responses are generated from 1,420 historical cases and real-time risk signals.
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
