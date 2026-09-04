'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  BrainCircuit,
  Search,
  ArrowLeftRight,
  SlidersHorizontal,
  Download,
  RefreshCw,
  ShieldAlert,
  Loader2,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

import {
  PageHeader,
  Card,
  RiskBadge,
  StatusBadge,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from '@/components/shared/page-primitives';

import {
  getTransactions,
  predictRisk,
} from '@/lib/api';

type BackendTransaction = {
  _id?: string;
  transaction_id?: string;
  customer_id?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  merchant_id?: string;
  device_id?: string;
  ip_address?: string;
  location?: string;
  status?: string;
  created_at?: string;

  risk_score?: number;
  riskScore?: number;
  risk?: number;
  decision?: string;
  risk_decision?: string;
};

type RiskDriver = {
  title?: string;
  signal?: string;
  reason?: string;
  impact?: number;
  contribution?: number;
  score?: number;
  severity?: string;
  category?: string;
};

type RiskRule = {
  title?: string;
  rule?: string;
  signal?: string;
  reason?: string;
  impact?: number;
  contribution?: number;
  score?: number;
  severity?: string;
  category?: string;
};

type RiskExplanation = {
  summary?: string;
  risk_level?: string;
  decision?: string;

  top_risk_drivers?: RiskDriver[];

  rule_explanations?: RiskRule[];

  component_contributions?: {
    ml?: number;
    rules?: number;
    anomaly?: number;
  };

  signal_count?: number;
  ml_probability?: number;
  ml_score?: number;
  rule_score?: number;
  anomaly_score?: number;
  explainability_method?: string;
};

type RiskResult = {
  risk_score?: number;
  riskScore?: number;
  score?: number;
  risk_level?: string;
  riskLevel?: string;
  decision?: string;

  ml_probability?: number;
  ml_score?: number;
  rule_score?: number;
  anomaly_score?: number;

  explanation?: RiskExplanation;

  workflow?: {
    investigation?: unknown;
    alert?: unknown;
    recovery?: unknown;
  };

  investigation?: unknown;
  alert?: unknown;
  recovery?: unknown;
  signals?: unknown;
  rules?: unknown;
};

type Transaction = {
  id: string;
  customer: string;
  amount: number;
  currency: string;
  method: string;
  location: string;
  ip: string;
  device: string;
  time: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  decision: string;
};

const filters = [
  'Date',
  'Risk Level',
  'Amount',
  'Payment Method',
  'Country',
  'Status',
];

function normalize(value: unknown) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function getRiskLevel(score: number) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

function getRiskScore(tx: BackendTransaction) {
  return Number(
    tx.risk_score ??
      tx.riskScore ??
      tx.risk ??
      0
  );
}

function getDecision(tx: BackendTransaction) {
  const decision = normalize(
    tx.decision ?? tx.risk_decision
  );

  if (
    ['BLOCK', 'BLOCKED', 'DECLINE', 'DECLINED'].includes(
      decision
    )
  ) {
    return 'Decline';
  }

  if (
    ['REVIEW', 'INVESTIGATE', 'INVESTIGATING'].includes(
      decision
    )
  ) {
    return 'Review';
  }

  if (
    ['ALLOW', 'ALLOWED', 'APPROVE', 'APPROVED'].includes(
      decision
    )
  ) {
    return 'Approve';
  }

  return 'Not Analyzed';
}

function getDisplayStatus(
  tx: BackendTransaction
) {
  const status = normalize(tx.status);

  if (
    ['BLOCKED', 'DECLINED'].includes(status)
  ) {
    return 'Blocked';
  }

  if (
    ['REVIEW', 'INVESTIGATING'].includes(status)
  ) {
    return 'Investigating';
  }

  if (
    ['COMPLETED', 'COMPLETE', 'SUCCESS', 'SUCCEEDED'].includes(
      status
    )
  ) {
    return 'Completed';
  }

  return tx.status || 'Unknown';
}

function formatAmount(
  amount: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

function formatTime(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapTransaction(
  tx: BackendTransaction
): Transaction {
  const riskScore = getRiskScore(tx);

  return {
    id:
      tx.transaction_id ??
      tx._id ??
      'UNKNOWN',

    customer:
      tx.customer_id ??
      'UNKNOWN',

    amount: Number(tx.amount ?? 0),

    currency:
      tx.currency ??
      'INR',

    method:
      tx.payment_method ??
      'UNKNOWN',

    location:
      tx.location ??
      'Unknown',

    ip:
      tx.ip_address ??
      '—',

    device:
      tx.device_id ??
      '—',

    time: formatTime(
      tx.created_at
    ),

    status:
      getDisplayStatus(tx),

    riskScore,

    riskLevel:
      getRiskLevel(riskScore),

    decision:
      getDecision(tx),
  };
}

function formatScore(value: unknown) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return '0.0';
  }

  return number.toFixed(1);
}

/**
 * Supports both the old frontend shape and the
 * current backend explainability shape.
 */
function getDriverTitle(
  driver: RiskDriver
) {
  return (
    driver.title ??
    driver.signal ??
    'Risk signal'
  );
}

function getDriverImpact(
  driver: RiskDriver
) {
  return (
    driver.impact ??
    driver.contribution ??
    driver.score
  );
}

function getRuleTitle(
  rule: RiskRule
) {
  return (
    rule.title ??
    rule.rule ??
    rule.signal ??
    'Risk signal'
  );
}

function getRuleImpact(
  rule: RiskRule
) {
  return (
    rule.impact ??
    rule.contribution ??
    rule.score
  );
}

function formatDriverName(
  value: unknown
) {
  return String(value ?? 'Risk signal')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getDecisionIcon(
  decision?: string
) {
  const normalized = normalize(decision);

  if (
    ['ALLOW', 'APPROVE', 'APPROVED'].includes(
      normalized
    )
  ) {
    return (
      <CheckCircle2
        size={15}
        className="text-emerald-400"
      />
    );
  }

  if (
    ['REVIEW', 'INVESTIGATE'].includes(
      normalized
    )
  ) {
    return (
      <AlertTriangle
        size={15}
        className="text-amber-400"
      />
    );
  }

  return (
    <ShieldAlert
      size={15}
      className="text-rose-400"
    />
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [query, setQuery] =
    useState('');

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [riskResult, setRiskResult] =
    useState<RiskResult | null>(null);

  const [riskError, setRiskError] =
    useState<string | null>(null);

  const loadTransactions = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response =
        await getTransactions(100);

      const data = Array.isArray(response)
        ? response
        : [];

      setTransactions(
        data.map(mapTransaction)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load transactions'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();

    const interval = setInterval(() => {
      loadTransactions(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return transactions;
    }

    const q =
      query.toLowerCase();

    return transactions.filter(
      (tx) =>
        tx.id
          .toLowerCase()
          .includes(q) ||
        tx.customer
          .toLowerCase()
          .includes(q) ||
        tx.method
          .toLowerCase()
          .includes(q) ||
        tx.location
          .toLowerCase()
          .includes(q) ||
        tx.ip
          .toLowerCase()
          .includes(q) ||
        tx.device
          .toLowerCase()
          .includes(q)
    );
  }, [transactions, query]);

  const selectedTransaction =
    transactions.find(
      (tx) => tx.id === selectedId
    );

  const handleAnalyzeRisk = async () => {
    if (!selectedTransaction) return;

    try {
      setAnalyzing(true);
      setRiskError(null);
      setRiskResult(null);

      const result =
        await predictRisk(
          selectedTransaction.id
        );

      setRiskResult(result);

      await loadTransactions(true);
    } catch (err) {
      setRiskError(
        err instanceof Error
          ? err.message
          : 'Risk analysis failed'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelect = (
    id: string
  ) => {
    setSelectedId(id);
    setRiskResult(null);
    setRiskError(null);
  };

  const handleExport = () => {
    const headers = [
      'Transaction ID',
      'Customer',
      'Amount',
      'Currency',
      'Payment Method',
      'Location',
      'IP Address',
      'Device ID',
      'Risk Score',
      'Risk Level',
      'Decision',
      'Status',
      'Timestamp',
    ];

    const rows =
      filtered.map((tx) => [
        tx.id,
        tx.customer,
        tx.amount,
        tx.currency,
        tx.method,
        tx.location,
        tx.ip,
        tx.device,
        tx.riskScore,
        tx.riskLevel,
        tx.decision,
        tx.status,
        tx.time,
      ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(
              /"/g,
              '""'
            )}"`
          )
          .join(',')
      )
      .join('\n');

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      'ledgerguard-transactions.csv';

    link.click();

    URL.revokeObjectURL(url);
  };

  const explanation =
    riskResult?.explanation;

  const topDrivers =
    explanation?.top_risk_drivers ?? [];

  const ruleExplanations =
    explanation?.rule_explanations ?? [];

  const contributions =
    explanation?.component_contributions;

  return (
    <PageContainer>

      <PageHeader
        title="Transaction Intelligence"
        subtitle="Search, analyze and investigate live transactions"
        icon={ArrowLeftRight}
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
        }}
      >
        <div className="relative">

          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-lg-muted"
          />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search by Transaction ID, Customer ID, Email, Device ID, IP..."
            className="w-full bg-lg-surface border border-lg rounded-lg pl-9 pr-4 py-2.5 text-[12px] text-white placeholder:text-lg-muted focus:outline-none focus:border-blue-500/30 transition-colors"
          />

        </div>
      </motion.div>

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
          delay: 0.05,
        }}
        className="flex items-center gap-2 flex-wrap"
      >

        <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-lg-muted">
          <SlidersHorizontal size={12} />
          FILTERS
        </div>

        {filters.map((filter) => (
          <button
            key={filter}
            className="px-2.5 py-1 text-[11px] font-mono-tech text-lg-dim bg-lg-surface border border-lg rounded hover:border-blue-500/20 hover:text-white transition-colors"
          >
            {filter}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() =>
            loadTransactions(true)
          }
          disabled={refreshing}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono-tech text-lg-dim bg-lg-surface border border-lg rounded hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={12}
            className={
              refreshing
                ? 'animate-spin'
                : ''
            }
          />
          Refresh
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono-tech text-lg-blue bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/15 transition-colors"
        >
          <Download size={12} />
          Export
        </button>

      </motion.div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[11px] text-rose-300">
          <div className="font-semibold mb-1">
            Transaction feed unavailable
          </div>

          <div className="text-rose-300/70">
            {error}
          </div>
        </div>
      )}

      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
          delay: 0.1,
        }}
      >

        <Card
          title="All Transactions"
          subtitle={`${filtered.length} transactions`}
          action={
            <span className="flex items-center gap-1.5 text-[10px] font-mono-tech text-lg-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE FEED
            </span>
          }
        >

          <TableContainer>

            <thead>
              <tr>
                <Th>Transaction ID</Th>
                <Th>Timestamp</Th>
                <Th>Customer</Th>
                <Th className="text-right">
                  Amount
                </Th>
                <Th>Payment Method</Th>
                <Th>Location</Th>
                <Th>Risk Score</Th>
                <Th>Risk Level</Th>
                <Th>AI Decision</Th>
                <Th>Status</Th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Loader2
                        size={20}
                        className="animate-spin text-lg-blue"
                      />

                      <span className="text-[11px] font-mono-tech text-lg-muted">
                        Loading live transactions...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center"
                  >
                    <div className="text-[11px] font-mono-tech text-lg-muted">
                      No transactions found
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(
                  (tx, index) => (
                    <motion.tr
                      key={tx.id}
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay:
                          index * 0.02,
                      }}
                      onClick={() =>
                        handleSelect(
                          tx.id
                        )
                      }
                      className="border-b border-lg/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >

                      <Td className="font-mono-tech text-white/80">
                        {tx.id}
                      </Td>

                      <Td className="font-mono-tech text-lg-muted">
                        {tx.time}
                      </Td>

                      <Td className="font-mono-tech text-lg-muted">
                        {tx.customer}
                      </Td>

                      <Td className="text-right font-mono-tech text-white">
                        {formatAmount(
                          tx.amount,
                          tx.currency
                        )}
                      </Td>

                      <Td className="text-white/70">
                        {tx.method}
                      </Td>

                      <Td className="text-lg-muted">
                        {tx.location}
                      </Td>

                      <Td>
                        <RiskBadge
                          score={
                            tx.riskScore
                          }
                          level={
                            tx.riskLevel
                          }
                        />
                      </Td>

                      <Td>
                        <span className="text-[10px] font-mono-tech uppercase text-lg-dim">
                          {tx.riskLevel}
                        </span>
                      </Td>

                      <Td className="text-white/70">
                        {tx.decision}
                      </Td>

                      <Td>
                        <StatusBadge
                          status={
                            tx.status
                          }
                        />
                      </Td>

                    </motion.tr>
                  )
                )
              )}

            </tbody>

          </TableContainer>

        </Card>

      </motion.div>

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
          onClick={() =>
            setSelectedId(null)
          }
        >

          <aside
            className="h-full w-full max-w-lg overflow-y-auto bg-lg-surface border-l border-lg p-5"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-center justify-between mb-5">

              <div>
                <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                  Transaction workspace
                </div>

                <h2 className="text-lg font-bold text-white">
                  {selectedTransaction.id}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedId(null)
                }
                className="text-lg-muted hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">

              <div className="p-3 rounded border border-rose-500/20 bg-rose-500/5">

                <div className="text-[10px] text-lg-muted">
                  Risk score
                </div>

                <div className="text-2xl font-bold text-rose-400">
                  {selectedTransaction.riskScore}
                  /100
                </div>

              </div>

              <div className="p-3 rounded border border-blue-500/20 bg-blue-500/5">

                <div className="text-[10px] text-lg-muted">
                  AI decision
                </div>

                <div className="flex items-center gap-2 text-lg font-bold text-white">
                  {getDecisionIcon(
                    selectedTransaction.decision
                  )}

                  {selectedTransaction.decision}
                </div>

              </div>

            </div>

            <Card
              title="Transaction information"
            >

              <div className="grid grid-cols-2 gap-y-3 text-[11px]">

                <span className="text-lg-muted">
                  Timestamp
                </span>

                <span className="text-white">
                  {selectedTransaction.time}
                </span>

                <span className="text-lg-muted">
                  Customer
                </span>

                <span className="font-mono-tech text-white">
                  {selectedTransaction.customer}
                </span>

                <span className="text-lg-muted">
                  Amount
                </span>

                <span className="font-mono-tech text-white">
                  {formatAmount(
                    selectedTransaction.amount,
                    selectedTransaction.currency
                  )}
                </span>

                <span className="text-lg-muted">
                  Payment method
                </span>

                <span className="text-white">
                  {selectedTransaction.method}
                </span>

                <span className="text-lg-muted">
                  Device ID
                </span>

                <span className="font-mono-tech text-white">
                  {selectedTransaction.device}
                </span>

                <span className="text-lg-muted">
                  IP address
                </span>

                <span className="font-mono-tech text-white">
                  {selectedTransaction.ip}
                </span>

                <span className="text-lg-muted">
                  Location
                </span>

                <span className="text-white">
                  {selectedTransaction.location}
                </span>

                <span className="text-lg-muted">
                  Status
                </span>

                <StatusBadge
                  status={
                    selectedTransaction.status
                  }
                />

              </div>

            </Card>

            <button
              onClick={handleAnalyzeRisk}
              disabled={analyzing}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-[11px] font-mono-tech text-blue-300 hover:bg-blue-500/15 transition-colors disabled:opacity-50"
            >

              {analyzing ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  ANALYZING TRANSACTION...
                </>
              ) : (
                <>
                  <BrainCircuit
                    size={15}
                  />

                  RUN AI RISK ANALYSIS
                </>
              )}

            </button>

            {riskError && (
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-300">
                {riskError}
              </div>
            )}

            {riskResult && (
              <div className="mt-4 space-y-3">

                <Card
                  title="AI Risk Analysis"
                  subtitle="Live result from LedgerGuard risk engine"
                >

                  <div className="space-y-4">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <BrainCircuit
                            size={15}
                            className="text-blue-300"
                          />
                        </div>

                        <div>
                          <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                            Final risk score
                          </div>

                          <div className="text-2xl font-bold text-white">
                            {formatScore(
                              riskResult.risk_score ??
                                riskResult.riskScore ??
                                riskResult.score
                            )}
                            <span className="text-sm text-lg-muted">
                              /100
                            </span>
                          </div>
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                          Decision
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-1 text-sm font-semibold text-white">
                          {getDecisionIcon(
                            riskResult.decision
                          )}

                          {String(
                            riskResult.decision ??
                              'UNKNOWN'
                          )}
                        </div>

                      </div>

                    </div>

                    <div className="grid grid-cols-2 gap-2">

                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">

                        <div className="text-[10px] text-lg-muted uppercase">
                          Risk level
                        </div>

                        <div className="mt-1 text-[12px] font-mono-tech uppercase text-rose-300">
                          {String(
                            riskResult.risk_level ??
                              riskResult.riskLevel ??
                              'UNKNOWN'
                          )}
                        </div>

                      </div>

                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">

                        <div className="text-[10px] text-lg-muted uppercase">
                          Signals
                        </div>

                        <div className="mt-1 text-[12px] font-mono-tech text-white">
                          {explanation?.signal_count ??
                            '—'}
                        </div>

                      </div>

                    </div>

                    {explanation?.summary && (
                      <div className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-3">

                        <div className="flex items-start gap-2">

                          <Activity
                            size={14}
                            className="mt-0.5 shrink-0 text-blue-300"
                          />

                          <div>

                            <div className="text-[10px] font-mono-tech uppercase text-blue-300 mb-1">
                              AI explanation
                            </div>

                            <p className="text-[11px] leading-5 text-white/70">
                              {explanation.summary}
                            </p>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </Card>

                <Card
                  title="Risk engine components"
                  subtitle="Hybrid model attribution"
                >

                  <div className="grid grid-cols-3 gap-2">

                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">

                      <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-lg-muted uppercase">
                        <BrainCircuit size={11} />
                        ML Model
                      </div>

                      <div className="mt-2 text-lg font-bold text-white">
                        {formatScore(
                          riskResult.ml_score ??
                            explanation?.ml_score
                        )}
                      </div>

                      <div className="mt-1 text-[9px] text-lg-muted">
                        60% weight
                      </div>

                    </div>

                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">

                      <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-lg-muted uppercase">
                        <ShieldAlert size={11} />
                        Rules
                      </div>

                      <div className="mt-2 text-lg font-bold text-white">
                        {formatScore(
                          riskResult.rule_score ??
                            explanation?.rule_score
                        )}
                      </div>

                      <div className="mt-1 text-[9px] text-lg-muted">
                        20% weight
                      </div>

                    </div>

                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">

                      <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-lg-muted uppercase">
                        <Activity size={11} />
                        Anomaly
                      </div>

                      <div className="mt-2 text-lg font-bold text-white">
                        {formatScore(
                          riskResult.anomaly_score ??
                            explanation?.anomaly_score
                        )}
                      </div>

                      <div className="mt-1 text-[9px] text-lg-muted">
                        20% weight
                      </div>

                    </div>

                  </div>

                  {contributions && (
                    <div className="mt-3 space-y-2">

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-lg-muted">
                          ML contribution
                        </span>

                        <span className="font-mono-tech text-white">
                          {formatScore(
                            contributions.ml
                          )}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-400"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(
                                  contributions.ml ??
                                    0
                                )
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-lg-muted">
                          Rule contribution
                        </span>

                        <span className="font-mono-tech text-white">
                          {formatScore(
                            contributions.rules
                          )}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(
                                  contributions.rules ??
                                    0
                                )
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-lg-muted">
                          Anomaly contribution
                        </span>

                        <span className="font-mono-tech text-white">
                          {formatScore(
                            contributions.anomaly
                          )}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-400"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(
                                  contributions.anomaly ??
                                    0
                                )
                              )
                            )}%`,
                          }}
                        />
                      </div>

                    </div>
                  )}

                </Card>

                {topDrivers.length > 0 && (
                  <Card
                    title="Top risk drivers"
                    subtitle="Signals contributing to the decision"
                  >

                    <div className="space-y-2">

                      {topDrivers.map(
                        (driver, index) => {
                          const title =
                            getDriverTitle(
                              driver
                            );

                          const impact =
                            getDriverImpact(
                              driver
                            );

                          return (
                            <div
                              key={`${title}-${index}`}
                              className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                            >

                              <div className="flex items-start gap-3">

                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rose-500/15 bg-rose-500/5 text-[10px] font-mono-tech text-rose-300">
                                  {index + 1}
                                </div>

                                <div className="min-w-0 flex-1">

                                  <div className="flex items-center justify-between gap-3">

                                    <div className="text-[11px] font-semibold text-white">
                                      {formatDriverName(
                                        title
                                      )}
                                    </div>

                                    {impact !==
                                      undefined && (
                                      <span className="shrink-0 text-[10px] font-mono-tech text-rose-300">
                                        +
                                        {formatScore(
                                          impact
                                        )}
                                      </span>
                                    )}

                                  </div>

                                  {driver.reason && (
                                    <p className="mt-1 text-[10px] leading-4 text-lg-muted">
                                      {driver.reason}
                                    </p>
                                  )}

                                  {driver.severity && (
                                    <div className="mt-2 text-[9px] font-mono-tech uppercase text-rose-300/70">
                                      {driver.severity}
                                    </div>
                                  )}

                                </div>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </Card>
                )}

                {ruleExplanations.length > 0 && (
                  <Card
                    title="Triggered rules"
                    subtitle="Explainable rule-based signals"
                  >

                    <div className="space-y-2">

                      {ruleExplanations.map(
                        (rule, index) => {
                          const title =
                            getRuleTitle(
                              rule
                            );

                          const impact =
                            getRuleImpact(
                              rule
                            );

                          return (
                            <div
                              key={`${title}-${index}`}
                              className="flex items-start gap-3 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3"
                            >

                              <div className="mt-0.5 shrink-0">
                                <Zap
                                  size={14}
                                  className="text-amber-300"
                                />
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex items-center justify-between gap-3">

                                  <span className="text-[11px] font-semibold text-white">
                                    {formatDriverName(
                                      title
                                    )}
                                  </span>

                                  {impact !==
                                    undefined && (
                                    <span className="shrink-0 text-[10px] font-mono-tech text-amber-300">
                                      +
                                      {formatScore(
                                        impact
                                      )}
                                    </span>
                                  )}

                                </div>

                                {rule.reason && (
                                  <p className="mt-1 text-[10px] leading-4 text-lg-muted">
                                    {rule.reason}
                                  </p>
                                )}

                                {rule.severity && (
                                  <div className="mt-2 text-[9px] font-mono-tech uppercase text-amber-300/70">
                                    {rule.severity}
                                  </div>
                                )}

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </Card>
                )}

                <div className="rounded-lg border border-white/5 bg-white/[0.015] p-3">

                  <div className="grid grid-cols-2 gap-3 text-[10px]">

                    <div>
                      <div className="text-lg-muted uppercase">
                        Explainability
                      </div>

                      <div className="mt-1 font-mono-tech text-white">
                        {explanation?.explainability_method ??
                          'Hybrid attribution'}
                      </div>
                    </div>

                    <div>
                      <div className="text-lg-muted uppercase">
                        Engine status
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 font-mono-tech text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        ACTIVE
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {!riskResult && !riskError && (
              <Card
                title="Risk analysis"
                subtitle="No new analysis has been run for this transaction"
                className="mt-4"
              >

                <div className="flex gap-2 text-[11px] text-lg-muted">

                  <ShieldAlert
                    size={15}
                    className="text-lg-blue shrink-0"
                  />

                  Run the AI risk analysis to generate a
                  live risk assessment and explainable
                  decision.

                </div>

              </Card>
            )}

          </aside>

        </div>
      )}

    </PageContainer>
  );
}
