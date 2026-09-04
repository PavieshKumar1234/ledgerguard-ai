"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
  Activity,
  ChevronRight,
  RefreshCw,
  Database,
  MapPin,
  CreditCard,
  Search,
} from "lucide-react";

import {
  getTransactions,
  getInvestigations,
  getAlerts,
  getRecoveries,
  getChargebacks,
} from "@/lib/api";

import { formatINR } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ============================================================
   TYPES
============================================================ */

type Transaction = {
  _id?: string;
  transaction_id?: string;
  id?: string;

  customer_id?: string;
  customer?: string;

  amount?: number;
  currency?: string;

  payment_method?: string;
  merchant_id?: string;

  device_id?: string;
  ip_address?: string;
  location?: string;

  status?: string;
  created_at?: string;
  timestamp?: string;

  risk_score?: number;
  riskScore?: number;
  risk?: number;

  decision?: string;
  risk_decision?: string;
};

type Investigation = {
  _id?: string;
  investigation_id?: string;
  id?: string;

  transaction_id?: string;
  transaction?: string;

  customer_id?: string;
  merchant_id?: string;

  risk_score?: number;
  riskScore?: number;

  severity?: string;
  decision?: string;
  status?: string;

  ml_score?: number;
  ml_risk_score?: number;
  rules_score?: number;
  anomaly_score?: number;

  created_at?: string;
  updated_at?: string;
};

type Alert = {
  _id?: string;
  alert_id?: string;
  id?: string;

  transaction_id?: string;

  severity?: string;
  type?: string;
  title?: string;
  message?: string;

  amount?: number;
  exposure?: number;

  created_at?: string;
  timestamp?: string;
};

type Recovery = {
  _id?: string;
  recovery_id?: string;
  id?: string;

  transaction_id?: string;

  original_amount?: number;
  amount?: number;

  recovered_amount?: number;

  outstanding_amount?: number;

  status?: string;

  created_at?: string;
  updated_at?: string;
};

type Chargeback = {
  _id?: string;
  chargeback_id?: string;
  id?: string;

  transaction_id?: string;

  disputed_amount?: number;
  amount?: number;

  status?: string;

  created_at?: string;
  updated_at?: string;
};

type TimelinePoint = {
  hour: string;
  transactions: number;
  suspicious: number;
  blocked: number;
};

type RiskLevel =
  | "critical"
  | "high"
  | "medium"
  | "low";

type RiskDistribution = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type DashboardData = {
  transactions: Transaction[];
  investigations: Investigation[];
  alerts: Alert[];
  recoveries: Recovery[];
  chargebacks: Chargeback[];
};

/* ============================================================
   HELPERS
============================================================ */

function number(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function transactionId(
  tx: Transaction
): string {
  return (
    tx.transaction_id ??
    tx.id ??
    "UNKNOWN"
  );
}

function investigationTransactionId(
  item: Investigation
): string {
  return (
    item.transaction_id ??
    item.transaction ??
    ""
  );
}

function riskValue(
  item: Transaction | Investigation
): number {
  return Number(
    (item as any).risk_score ??
    (item as any).riskScore ??
    (item as any).risk ??
    0
  );
}

function normalizeRisk(
  score: number
): RiskLevel {
  if (score >= 80)
    return "critical";

  if (score >= 60)
    return "high";

  if (score >= 30)
    return "medium";

  return "low";
}

function riskClasses(
  level: RiskLevel
) {
  switch (level) {
    case "critical":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border:
          "border-rose-500/20",
      };

    case "high":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border:
          "border-amber-500/20",
      };

    case "medium":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border:
          "border-blue-500/20",
      };

    default:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border:
          "border-emerald-500/20",
      };
  }
}

function formatTime(
  value?: string
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatDate(
  value?: string
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function getStatus(
  value?: string
): string {
  return (
    value ??
    "UNKNOWN"
  ).toUpperCase();
}

function getRiskForTransaction(
  tx: Transaction,
  investigationMap: Map<
    string,
    Investigation
  >
): number {
  const direct =
    riskValue(tx);

  if (direct > 0)
    return direct;

  const investigation =
    investigationMap.get(
      transactionId(tx)
    );

  return investigation
    ? riskValue(
        investigation
      )
    : 0;
}

function getDecision(
  tx: Transaction,
  investigationMap: Map<
    string,
    Investigation
  >
): string {
  if (
    tx.decision ||
    tx.risk_decision
  ) {
    return (
      tx.decision ??
      tx.risk_decision ??
      "ALLOW"
    ).toUpperCase();
  }

  const investigation =
    investigationMap.get(
      transactionId(tx)
    );

  if (investigation?.decision) {
    return investigation.decision.toUpperCase();
  }

  const score =
    getRiskForTransaction(
      tx,
      investigationMap
    );

  if (score >= 80)
    return "BLOCK";

  if (score >= 50)
    return "REVIEW";

  return "ALLOW";
}

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  label,
  value,
  display,
  icon,
  accent,
  description,
  index,
}: {
  label: string;
  value: string;
  display?: string;
  icon: React.ReactNode;
  accent: string;
  description: string;
  index: number;
}) {
  return (
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
        duration: 0.25,
        delay: index * 0.05,
      }}
      className="bg-lg-surface border border-lg rounded-lg p-4 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-lg-muted font-mono-tech uppercase tracking-wide">
            {label}
          </p>

          <div className="mt-2 text-lg lg:text-xl font-semibold text-white font-mono-tech truncate">
            {display ?? value}
          </div>

          <p className="text-[9px] text-lg-dim mt-1 font-mono-tech">
            {description}
          </p>
        </div>

        <div
          className="w-8 h-8 rounded border flex items-center justify-center shrink-0"
          style={{
            borderColor: `${accent}33`,
            backgroundColor: `${accent}0d`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono-tech">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

        <span className="text-emerald-400">
          LIVE
        </span>

        <span className="text-lg-dim">
          • DATABASE TELEMETRY
        </span>
      </div>
    </motion.div>
  );
}

/* ============================================================
   TIMELINE
============================================================ */

function buildTimeline(
  transactions: Transaction[],
  investigationMap: Map<
    string,
    Investigation
  >
): TimelinePoint[] {
  const now = Date.now();

  const buckets: TimelinePoint[] =
    [];

  for (
    let i = 11;
    i >= 0;
    i--
  ) {
    const timestamp =
      now -
      i *
        2 *
        60 *
        60 *
        1000;

    const date =
      new Date(timestamp);

    buckets.push({
      hour:
        date.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
      transactions: 0,
      suspicious: 0,
      blocked: 0,
    });
  }

  for (const tx of transactions) {
    const raw =
      tx.created_at ??
      tx.timestamp;

    if (!raw) continue;

    const date =
      new Date(raw);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      continue;
    }

    const difference =
      now -
      date.getTime();

    if (
      difference < 0 ||
      difference >
        24 *
          60 *
          60 *
          1000
    ) {
      continue;
    }

    const index = Math.min(
      11,
      Math.max(
        0,
        11 -
          Math.floor(
            difference /
              (2 *
                60 *
                60 *
                1000)
          )
      )
    );

    const bucket =
      buckets[index];

    if (!bucket)
      continue;

    bucket.transactions +=
      1;

    const score =
      getRiskForTransaction(
        tx,
        investigationMap
      );

    const decision =
      getDecision(
        tx,
        investigationMap
      );

    if (score >= 30) {
      bucket.suspicious +=
        1;
    }

    if (
      decision === "BLOCK"
    ) {
      bucket.blocked +=
        1;
    }
  }

  return buckets;
}

/* ============================================================
   RISK TIMELINE
============================================================ */

function RiskTimelineChart({
  data,
}: {
  data: TimelinePoint[];
}) {
  const total =
    data.reduce(
      (sum, item) =>
        sum +
        item.transactions,
      0
    );

  const suspicious =
    data.reduce(
      (sum, item) =>
        sum +
        item.suspicious,
      0
    );

  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Risk Intelligence Timeline
          </h3>

          <p className="text-[11px] text-lg-muted mt-0.5">
            Transaction activity across the live 24H window
          </p>
        </div>

        <div className="text-right font-mono-tech">
          <div className="text-[10px] text-lg-blue">
            {total} TX
          </div>

          <div className="text-[9px] text-rose-400">
            {suspicious} FLAGGED
          </div>
        </div>
      </div>

      <ResponsiveContainer
        width="100%"
        height={220}
      >
        <AreaChart
          data={data}
        >
          <defs>
            <linearGradient
              id="transactionGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2b8eff"
                stopOpacity={0.25}
              />

              <stop
                offset="100%"
                stopColor="#2b8eff"
                stopOpacity={0}
              />
            </linearGradient>

            <linearGradient
              id="suspiciousGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#f43f5e"
                stopOpacity={0.25}
              />

              <stop
                offset="100%"
                stopColor="#f43f5e"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="hour"
            stroke="#4a5360"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#4a5360"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor:
                "#0d1117",
              border:
                "1px solid #1a2029",
              borderRadius:
                "6px",
              fontSize: "11px",
            }}
            labelStyle={{
              color: "#ffffff",
            }}
          />

          <Area
            type="monotone"
            dataKey="transactions"
            name="Transactions"
            stroke="#2b8eff"
            strokeWidth={1.5}
            fill="url(#transactionGradient)"
          />

          <Area
            type="monotone"
            dataKey="suspicious"
            name="Suspicious"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="url(#suspiciousGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-2 text-[10px] font-mono-tech">
        <span className="flex items-center gap-1.5 text-lg-muted">
          <span className="w-2 h-0.5 bg-blue-500" />
          Transactions
        </span>

        <span className="flex items-center gap-1.5 text-lg-muted">
          <span className="w-2 h-0.5 bg-rose-500" />
          Suspicious
        </span>
      </div>

      <div className="mt-2 text-[9px] text-lg-dim font-mono-tech">
        WINDOW: 24H • SOURCE: MONGODB
      </div>
    </div>
  );
}

/* ============================================================
   RISK DISTRIBUTION
============================================================ */

function RiskDistributionChart({
  distribution,
}: {
  distribution: RiskDistribution;
}) {
  const data = [
    {
      name: "Critical",
      value:
        distribution.critical,
      color: "#f43f5e",
    },
    {
      name: "High",
      value:
        distribution.high,
      color: "#f59e0b",
    },
    {
      name: "Medium",
      value:
        distribution.medium,
      color: "#2b8eff",
    },
    {
      name: "Low",
      value:
        distribution.low,
      color: "#22c55e",
    },
  ];

  const total =
    data.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );

  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Risk Distribution
          </h3>

          <p className="text-[11px] text-lg-muted mt-0.5">
            Evaluated transaction risk
          </p>
        </div>

        <span className="text-[10px] font-mono-tech text-lg-blue">
          {total} CASES
        </span>
      </div>

      <ResponsiveContainer
        width="100%"
        height={165}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={70}
            paddingAngle={2}
            stroke="none"
          >
            {data.map(
              (entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.color
                  }
                />
              )
            )}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor:
                "#0d1117",
              border:
                "1px solid #1a2029",
              borderRadius:
                "6px",
              fontSize: "11px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2">
        {data.map(
          (item) => (
            <div
              key={
                item.name
              }
              className="flex items-center gap-1.5"
            >
              <span
                className="w-2 h-2 rounded-sm"
                style={{
                  backgroundColor:
                    item.color,
                }}
              />

              <span className="text-[10px] text-lg-muted">
                {item.name}
              </span>

              <span className="ml-auto text-[10px] font-mono-tech text-white">
                {item.value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   RECOVERY OPERATIONS
============================================================ */

function RecoveryOperations({
  recoveries,
}: {
  recoveries: Recovery[];
}) {
  const original =
    recoveries.reduce(
      (sum, item) =>
        sum +
        number(
          item.original_amount ??
            item.amount
        ),
      0
    );

  const recovered =
    recoveries.reduce(
      (sum, item) =>
        sum +
        number(
          item.recovered_amount
        ),
      0
    );

  const outstanding = Math.max(
    0,
    original - recovered
  );

  const rate =
    original > 0
      ? (recovered /
          original) *
        100
      : 0;

  const completed =
    recoveries.filter(
      (item) =>
        getStatus(
          item.status
        ) === "RECOVERED" ||
        getStatus(
          item.status
        ) === "COMPLETED"
    ).length;

  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Revenue Recovery
          </h3>

          <p className="text-[11px] text-lg-muted mt-0.5">
            Actual recovery pipeline
          </p>
        </div>

        <span className="text-[10px] font-mono-tech text-emerald-400">
          {rate.toFixed(1)}%
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] font-mono-tech mb-1">
            <span className="text-lg-muted">
              IDENTIFIED
            </span>

            <span className="text-white">
              {formatINR(
                original
              )}
            </span>
          </div>

          <div className="h-2 bg-white/[0.03] rounded overflow-hidden">
            <div className="h-full bg-blue-500/40 rounded w-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono-tech mb-1">
            <span className="text-lg-muted">
              RECOVERED
            </span>

            <span className="text-emerald-400">
              {formatINR(
                recovered
              )}
            </span>
          </div>

          <div className="h-2 bg-white/[0.03] rounded overflow-hidden">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${Math.min(
                  100,
                  rate
                )}%`,
              }}
              transition={{
                duration: 0.6,
              }}
              className="h-full bg-emerald-500/50 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="border border-lg rounded p-2">
            <p className="text-[9px] text-lg-dim font-mono-tech">
              OUTSTANDING
            </p>

            <p className="text-xs text-amber-400 font-mono-tech mt-1">
              {formatINR(
                outstanding
              )}
            </p>
          </div>

          <div className="border border-lg rounded p-2">
            <p className="text-[9px] text-lg-dim font-mono-tech">
              COMPLETED
            </p>

            <p className="text-xs text-white font-mono-tech mt-1">
              {completed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AI EXECUTIVE BRIEF
============================================================ */

function AiExecutiveBrief({
  fraudExposure,
  blocked,
  suspicious,
  chargebacks,
  recoveryRate,
}: {
  fraudExposure: number;
  blocked: number;
  suspicious: number;
  chargebacks: number;
  recoveryRate: number;
}) {
  let summary =
    "LedgerGuard is actively monitoring the merchant transaction stream.";

  if (fraudExposure > 0) {
    summary =
      `${formatINR(
        fraudExposure
      )} of transaction value is currently associated with elevated-risk activity. `;
  }

  if (blocked > 0) {
    summary +=
      `${blocked} transaction${blocked === 1 ? "" : "s"} currently meet the blocking criteria. `;
  } else {
    summary +=
      "No transaction is currently classified as blocked. ";
  }

  const impact =
    chargebacks > 0
      ? `${chargebacks} chargeback case${chargebacks === 1 ? "" : "s"} require continued defense monitoring.`
      : "No chargeback cases are currently present in the live dataset.";

  const recommendation =
    suspicious > 0
      ? "Prioritize critical and high-risk investigations, then process outstanding recovery opportunities."
      : "Continue monitoring the live transaction stream and evaluate new risk signals as they arrive.";

  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit
            size={16}
            className="text-lg-blue"
          />

          <h3 className="text-sm font-semibold text-white">
            AI Executive Brief
          </h3>

          <span className="ml-auto text-[9px] font-mono-tech text-emerald-400">
            LIVE
          </span>
        </div>

        <p className="text-[12px] text-white/80 leading-relaxed mb-3">
          {summary}
        </p>

        <div className="space-y-2">
          <div className="flex gap-2 text-[11px]">
            <span className="text-rose-400 font-mono-tech shrink-0">
              IMPACT
            </span>

            <span className="text-white/70">
              {impact}
            </span>
          </div>

          <div className="flex gap-2 text-[11px]">
            <span className="text-lg-blue font-mono-tech shrink-0">
              ACTION
            </span>

            <span className="text-white/70">
              {recommendation}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-lg flex items-center justify-between">
          <span className="text-[9px] text-lg-dim font-mono-tech">
            RECOVERY RATE
          </span>

          <span className="text-[10px] text-emerald-400 font-mono-tech">
            {recoveryRate.toFixed(
              1
            )}
            %
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[9px] font-mono-tech text-lg-dim">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          GENERATED FROM LIVE DATABASE TELEMETRY
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CRITICAL FEED
============================================================ */

function CriticalFeed({
  alerts,
  transactions,
  investigationMap,
}: {
  alerts: Alert[];
  transactions: Transaction[];
  investigationMap: Map<
    string,
    Investigation
  >;
}) {
  const transactionMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          Transaction
        >();

      for (const tx of transactions) {
        map.set(
          transactionId(tx),
          tx
        );
      }

      return map;
    }, [transactions]);

  const criticalItems =
    useMemo(() => {
      const items =
        [...alerts];

      return items
        .sort(
          (a, b) => {
            const rank: Record<
              string,
              number
            > = {
              CRITICAL: 4,
              HIGH: 3,
              MEDIUM: 2,
              LOW: 1,
            };

            return (
              (rank[
                getStatus(
                  b.severity
                )
              ] ?? 0) -
              (rank[
                getStatus(
                  a.severity
                )
              ] ?? 0)
            );
          }
        )
        .slice(0, 8);
    }, [alerts]);

  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Critical Intelligence Feed
          </h3>

          <p className="text-[10px] text-lg-dim font-mono-tech mt-0.5">
            LIVE ALERT STREAM
          </p>
        </div>

        <span className="text-[9px] font-mono-tech text-rose-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          {criticalItems.length} ALERTS
        </span>
      </div>

      <div className="space-y-1 max-h-[250px] overflow-y-auto scrollbar-thin">
        {criticalItems.length ===
        0 ? (
          <div className="py-10 text-center">
            <ShieldCheck
              size={22}
              className="mx-auto text-emerald-400 mb-2"
            />

            <p className="text-[11px] text-lg-muted font-mono-tech">
              NO ACTIVE ALERTS
            </p>

            <p className="text-[10px] text-lg-dim mt-1">
              Alert stream is clear
            </p>
          </div>
        ) : (
          criticalItems.map(
            (
              alert,
              index
            ) => {
              const severity =
                getStatus(
                  alert.severity
                );

              const tx =
                alert.transaction_id
                  ? transactionMap.get(
                      alert.transaction_id
                    )
                  : undefined;

              const investigation =
                alert.transaction_id
                  ? investigationMap.get(
                      alert.transaction_id
                    )
                  : undefined;

              const score =
                tx
                  ? getRiskForTransaction(
                      tx,
                      investigationMap
                    )
                  : investigation
                    ? riskValue(
                        investigation
                      )
                    : 0;

              const level =
                normalizeRisk(
                  score
                );

              const colors =
                riskClasses(
                  level
                );

              return (
                <motion.div
                  key={
                    alert.alert_id ??
                    alert.id ??
                    `${alert.transaction_id}-${index}`
                  }
                  initial={{
                    opacity: 0,
                    x: -8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.03,
                  }}
                  className="flex items-start gap-2.5 p-2 rounded-md hover:bg-white/[0.02] transition-colors group"
                >
                  <div
                    className={`shrink-0 mt-0.5 p-1 rounded border ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    {level ===
                    "critical" ? (
                      <AlertTriangle
                        size={12}
                      />
                    ) : (
                      <Activity
                        size={12}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono-tech text-lg-dim">
                        {alert.alert_id ??
                          alert.id ??
                          "ALERT"}
                      </span>

                      <span
                        className={`text-[9px] font-mono-tech ${colors.text}`}
                      >
                        {severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-white/80 mt-0.5 leading-snug truncate">
                      {alert.message ??
                        alert.title ??
                        `Risk alert for ${alert.transaction_id ?? "transaction"}`}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[9px] font-mono-tech text-lg-dim">
                      <span>
                        {alert.transaction_id ??
                          "—"}
                      </span>

                      <span>
                        {formatINR(
                          number(
                            alert.exposure ??
                              alert.amount ??
                              tx?.amount
                          )
                        )}
                      </span>

                      <span>
                        {formatTime(
                          alert.created_at ??
                            alert.timestamp
                        )}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={13}
                    className="text-lg-dim group-hover:text-white transition-colors shrink-0 mt-1"
                  />
                </motion.div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   GEOGRAPHIC EXPOSURE
============================================================ */

function GeographicExposure({
  transactions,
  investigationMap,
}: {
  transactions: Transaction[];
  investigationMap: Map<
    string,
    Investigation
  >;
}) {
  const regions =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          {
            volume: number;
            suspicious: number;
            maxRisk: number;
          }
        >();

      for (const tx of transactions) {
        const region =
          tx.location?.trim() ||
          "Unknown";

        const existing =
          grouped.get(region) ?? {
            volume: 0,
            suspicious: 0,
            maxRisk: 0,
          };

        const amount =
          number(tx.amount);

        const score =
          getRiskForTransaction(
            tx,
            investigationMap
          );

        existing.volume += amount;

        existing.maxRisk =
          Math.max(
            existing.maxRisk,
            score
          );

        if (score >= 30) {
          existing.suspicious +=
            amount;
        }

        grouped.set(
          region,
          existing
        );
      }

      return Array.from(
        grouped.entries()
      )
        .map(
          ([
            region,
            data,
          ]) => ({
            region,
            ...data,
          })
        )
        .sort(
          (a, b) =>
            b.suspicious -
              a.suspicious ||
            b.maxRisk -
              a.maxRisk ||
            b.volume -
              a.volume
        )
        .slice(0, 8);
    }, [
      transactions,
      investigationMap,
    ]);

  const max =
    Math.max(
      ...regions.map(
        (item) =>
          item.suspicious
      ),
      1
    );

  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Geographic Risk Exposure
          </h3>

          <p className="text-[10px] text-lg-muted mt-0.5">
            Value associated with elevated-risk transactions
          </p>
        </div>

        <MapPin
          size={14}
          className="text-lg-blue"
        />
      </div>

      {regions.length ===
      0 ? (
        <div className="py-10 text-center text-[10px] text-lg-dim font-mono-tech">
          NO GEOGRAPHIC DATA
        </div>
      ) : (
        <div className="space-y-2">
          {regions.map(
            (
              region,
              index
            ) => {
              /*
               * Geographic risk is determined from the
               * highest actual transaction risk score
               * in the region, not from transaction value.
               *
               * This keeps the geographic panel aligned
               * with the LedgerGuard risk engine.
               */
              const riskLevel =
                normalizeRisk(
                  region.maxRisk
                );

              const risk =
                region.suspicious <=
                  0
                  ? "CLEAR"
                  : riskLevel.toUpperCase();

              const percentage =
                region.suspicious >
                0
                  ? (region.suspicious /
                      max) *
                    100
                  : 0;

              const riskTextClass =
                risk === "CRITICAL"
                  ? "text-rose-400"
                  : risk === "HIGH"
                    ? "text-amber-400"
                    : risk === "MEDIUM"
                      ? "text-blue-400"
                      : risk === "LOW"
                        ? "text-emerald-400"
                        : "text-lg-dim";

              const barClass =
                risk === "CRITICAL"
                  ? "bg-rose-500/50"
                  : risk === "HIGH"
                    ? "bg-amber-500/50"
                    : risk === "MEDIUM"
                      ? "bg-blue-500/40"
                      : risk === "LOW"
                        ? "bg-emerald-500/30"
                        : "bg-white/10";

              return (
                <motion.div
                  key={
                    region.region
                  }
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    delay:
                      index *
                      0.04,
                  }}
                >
                  <div className="flex items-center gap-2 text-[10px] mb-1">
                    <span className="w-24 truncate text-white/80">
                      {region.region}
                    </span>

                    <span className="ml-auto font-mono-tech text-rose-400">
                      {formatINR(
                        region.suspicious
                      )}
                    </span>
                  </div>

                  <div className="h-1.5 bg-white/[0.03] rounded overflow-hidden">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${Math.min(
                          100,
                          percentage
                        )}%`,
                      }}
                      transition={{
                        duration:
                          0.5,
                      }}
                      className={`h-full rounded ${barClass}`}
                    />
                  </div>

                  <div className="flex justify-between mt-0.5 text-[8px] font-mono-tech">
                    <span className="text-lg-dim">
                      REGION VOLUME{" "}
                      {formatINR(
                        region.volume
                      )}
                    </span>

                    <span
                      className={
                        riskTextClass
                      }
                    >
                      {risk}
                      {region.maxRisk >
                        0 &&
                        ` • ${region.maxRisk.toFixed(0)}`}
                    </span>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-lg text-[8px] text-lg-dim font-mono-tech">
        RISK LEVEL DERIVED FROM HIGHEST TRANSACTION SCORE
      </div>
    </div>
  );
}

/* ============================================================
   RECENT TRANSACTIONS
============================================================ */

function RecentTransactionsTable({
  transactions,
  investigationMap,
}: {
  transactions: Transaction[];
  investigationMap: Map<
    string,
    Investigation
  >;
}) {
  return (
    <div className="bg-lg-surface border border-lg rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Recent Transactions
          </h3>

          <p className="text-[9px] text-lg-dim font-mono-tech mt-0.5">
            LIVE MONGODB STREAM
          </p>
        </div>

        <span className="text-[10px] font-mono-tech text-lg-blue">
          {transactions.length} RECORDS
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left text-lg-dim font-mono-tech border-b border-lg">
              <th className="pb-2 font-normal">
                Transaction
              </th>

              <th className="pb-2 font-normal">
                Customer
              </th>

              <th className="pb-2 font-normal text-right">
                Amount
              </th>

              <th className="pb-2 font-normal">
                Risk
              </th>

              <th className="pb-2 font-normal">
                Decision
              </th>

              <th className="pb-2 font-normal">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {transactions.length ===
            0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-lg-dim font-mono-tech"
                >
                  NO TRANSACTIONS FOUND
                </td>
              </tr>
            ) : (
              transactions
                .slice(0, 10)
                .map(
                  (
                    tx,
                    index
                  ) => {
                    const score =
                      getRiskForTransaction(
                        tx,
                        investigationMap
                      );

                    const level =
                      normalizeRisk(
                        score
                      );

                    const colors =
                      riskClasses(
                        level
                      );

                    const decision =
                      getDecision(
                        tx,
                        investigationMap
                      );

                    return (
                      <motion.tr
                        key={`${transactionId(tx)}-${index}`}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          delay:
                            index *
                            0.02,
                        }}
                        className="border-b border-lg/50 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2 font-mono-tech text-white/80">
                          {transactionId(
                            tx
                          )}
                        </td>

                        <td className="py-2 font-mono-tech text-lg-muted">
                          {tx.customer_id ??
                            tx.customer ??
                            "—"}
                        </td>

                        <td className="py-2 text-right font-mono-tech text-white">
                          {formatINR(
                            number(
                              tx.amount
                            )
                          )}
                        </td>

                        <td className="py-2">
                          {score >
                          0 ? (
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded border text-[9px] font-mono-tech ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                              {score.toFixed(
                                0
                              )}
                            </span>
                          ) : (
                            <span className="text-lg-dim font-mono-tech">
                              —
                            </span>
                          )}
                        </td>

                        <td className="py-2">
                          <span
                            className={`font-mono-tech ${
                              decision ===
                              "BLOCK"
                                ? "text-rose-400"
                                : decision ===
                                    "REVIEW"
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {
                              decision
                            }
                          </span>
                        </td>

                        <td className="py-2">
                          <span className="text-lg-muted font-mono-tech">
                            {getStatus(
                              tx.status
                            )}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  }
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export function OverviewDashboard() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    data,
    setData,
  ] =
    useState<DashboardData>({
      transactions: [],
      investigations: [],
      alerts: [],
      recoveries: [],
      chargebacks: [],
    });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState("");

  const loadDashboard =
    useCallback(
      async () => {
        if (authLoading || !user) {
          return;
        }

        try {
          setRefreshing(true);
          setError("");

          const [
            transactions,
            investigations,
            alerts,
            recoveries,
            chargebacks,
          ] =
            await Promise.all([
              getTransactions(
                100
              ),
              getInvestigations(
                100
              ),
              getAlerts(
                100
              ),
              getRecoveries(
                100
              ),
              getChargebacks(
                100
              ),
            ]);

          setData({
            transactions:
              Array.isArray(
                transactions
              )
                ? transactions
                : [],
            investigations:
              Array.isArray(
                investigations
              )
                ? investigations
                : [],
            alerts:
              Array.isArray(
                alerts
              )
                ? alerts
                : [],
            recoveries:
              Array.isArray(
                recoveries
              )
                ? recoveries
                : [],
            chargebacks:
              Array.isArray(
                chargebacks
              )
                ? chargebacks
                : [],
          });

          setLastUpdated(
            new Date().toLocaleTimeString(
              "en-IN",
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }
            )
          );
        } catch (
          requestError
        ) {
          console.error(
            "LedgerGuard dashboard error:",
            requestError
          );

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load live dashboard data"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [authLoading, user]
    );

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    loadDashboard();

    const interval =
      setInterval(
        loadDashboard,
        30000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    authLoading,
    user,
    loadDashboard,
  ]);

  /* ==========================================================
     INVESTIGATION MAP
  ========================================================== */

  const investigationMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          Investigation
        >();

      for (const item of data.investigations) {
        const id =
          investigationTransactionId(
            item
          );

        if (id) {
          map.set(
            id,
            item
          );
        }
      }

      return map;
    }, [
      data.investigations,
    ]);

  /* ==========================================================
     LIVE METRICS
  ========================================================== */

  const metrics =
    useMemo(() => {
      const transactions =
        data.transactions;

      const totalVolume =
        transactions.reduce(
          (sum, tx) =>
            sum +
            number(
              tx.amount
            ),
          0
        );

      let fraudExposure = 0;

      let blocked = 0;

      let suspicious = 0;

      const riskDistribution: RiskDistribution =
        {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };

      for (const tx of transactions) {
        const score =
          getRiskForTransaction(
            tx,
            investigationMap
          );

        const decision =
          getDecision(
            tx,
            investigationMap
          );

        if (score > 0) {
          const level =
            normalizeRisk(
              score
            );

          riskDistribution[
            level
          ] += 1;
        } else {
          riskDistribution.low +=
            1;
        }

        if (
          score >= 30
        ) {
          suspicious +=
            1;

          fraudExposure +=
            number(
              tx.amount
            );
        }

        if (
          decision ===
          "BLOCK"
        ) {
          blocked +=
            1;
        }
      }

      const originalRecovery =
        data.recoveries.reduce(
          (sum, item) =>
            sum +
            number(
              item.original_amount ??
                item.amount
            ),
          0
        );

      const recovered =
        data.recoveries.reduce(
          (sum, item) =>
            sum +
            number(
              item.recovered_amount
            ),
          0
        );

      const recoveryRate =
        originalRecovery >
        0
          ? (recovered /
              originalRecovery) *
            100
          : 0;

      const chargebackAmount =
        data.chargebacks.reduce(
          (sum, item) =>
            sum +
            number(
              item.disputed_amount ??
                item.amount
            ),
          0
        );

      return {
        totalVolume,
        transactionCount:
          transactions.length,
        fraudExposure,
        blocked,
        suspicious,
        recoveryRate,
        chargebacks:
          data.chargebacks.length,
        chargebackAmount,
        riskDistribution,
      };
    }, [
      data,
      investigationMap,
    ]);

  /* ==========================================================
     TIMELINE
  ========================================================== */

  const timeline =
    useMemo(
      () =>
        buildTimeline(
          data.transactions,
          investigationMap
        ),
      [
        data.transactions,
        investigationMap,
      ]
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loading &&
    data.transactions
      .length === 0
  ) {
    return (
      <div className="p-6">
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />

            <p className="mt-4 text-[11px] text-lg-muted font-mono-tech">
              INITIALIZING LEDGERGUARD INTELLIGENCE...
            </p>

            <p className="mt-1 text-[9px] text-lg-dim font-mono-tech">
              CONNECTING TO LIVE DATA PIPELINE
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR STATE
  ========================================================== */

  if (
    error &&
    data.transactions
      .length === 0
  ) {
    return (
      <div className="p-6">
        <div className="bg-lg-surface border border-rose-500/20 rounded-lg p-8 text-center">
          <AlertTriangle
            size={28}
            className="mx-auto text-rose-400 mb-3"
          />

          <h2 className="text-white font-semibold">
            Unable to load LedgerGuard intelligence
          </h2>

          <p className="text-[11px] text-lg-muted mt-2 max-w-xl mx-auto">
            {error}
          </p>

          <button
            onClick={
              loadDashboard
            }
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[11px] font-mono-tech hover:bg-blue-500/20"
          >
            <RefreshCw
              size={12}
            />
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-5 max-w-[1920px] mx-auto">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: -8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
        }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Financial Intelligence Command Center
            </h1>

            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-[8px] font-mono-tech text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          <p className="text-[12px] text-lg-muted mt-0.5">
            Real-time revenue protection, risk intelligence & recovery operations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono-tech ${
              error
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}
          >
            <Database size={11} />

            {error
              ? "PARTIAL DATA"
              : "LIVE DATABASE CONNECTED"}
          </div>

          <button
            onClick={
              loadDashboard
            }
            disabled={
              refreshing
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-lg text-[10px] font-mono-tech text-lg-muted hover:text-white hover:border-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={11}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            REFRESH
          </button>

          <div className="text-[10px] font-mono-tech text-lg-dim">
            {lastUpdated
              ? `UPDATED ${lastUpdated}`
              : "—"}
          </div>
        </div>
      </motion.div>

      {/* ======================================================
          PARTIAL DATA WARNING
      ====================================================== */}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle
            size={12}
            className="text-amber-400"
          />

          <span className="text-[10px] font-mono-tech text-amber-400">
            LIVE DATA WARNING:{" "}
            {error}
          </span>
        </div>
      )}

      {/* ======================================================
          KPI GRID
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          index={0}
          label="Transaction Volume"
          value={formatINR(
            metrics.totalVolume
          )}
          icon={
            <Activity
              size={14}
            />
          }
          accent="#2b8eff"
          description="LIVE PAYMENT VALUE"
        />

        <KpiCard
          index={1}
          label="Transactions"
          value={metrics.transactionCount.toLocaleString(
            "en-IN"
          )}
          icon={
            <Database
              size={14}
            />
          }
          accent="#00d4ff"
          description="RECORDED TRANSACTIONS"
        />

        <KpiCard
          index={2}
          label="Fraud Exposure"
          value={formatINR(
            metrics.fraudExposure
          )}
          icon={
            <AlertTriangle
              size={14}
            />
          }
          accent="#f43f5e"
          description={`${metrics.suspicious} ELEVATED-RISK TX`}
        />

        <KpiCard
          index={3}
          label="Blocked"
          value={metrics.blocked.toLocaleString(
            "en-IN"
          )}
          icon={
            <ShieldCheck
              size={14}
            />
          }
          accent="#f43f5e"
          description="RISK ENGINE DECISIONS"
        />

        <KpiCard
          index={4}
          label="Recovery Rate"
          value={`${metrics.recoveryRate.toFixed(
            1
          )}%`}
          icon={
            <ArrowUpRight
              size={14}
            />
          }
          accent="#22c55e"
          description="RECOVERED / IDENTIFIED"
        />

        <KpiCard
          index={5}
          label="Chargebacks"
          value={metrics.chargebacks.toLocaleString(
            "en-IN"
          )}
          icon={
            <CreditCard
              size={14}
            />
          }
          accent="#f59e0b"
          description={
            metrics.chargebackAmount >
            0
              ? `${formatINR(
                  metrics.chargebackAmount
                )} DISPUTED`
              : "NO DISPUTES RECORDED"
          }
        />
      </div>

      {/* ======================================================
          RISK INTELLIGENCE
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RiskTimelineChart
            data={
              timeline
            }
          />
        </div>

        <RiskDistributionChart
          distribution={
            metrics.riskDistribution
          }
        />
      </div>

      {/* ======================================================
          OPERATIONS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecoveryOperations
          recoveries={
            data.recoveries
          }
        />

        <AiExecutiveBrief
          fraudExposure={
            metrics.fraudExposure
          }
          blocked={
            metrics.blocked
          }
          suspicious={
            metrics.suspicious
          }
          chargebacks={
            metrics.chargebacks
          }
          recoveryRate={
            metrics.recoveryRate
          }
        />

        <CriticalFeed
          alerts={
            data.alerts
          }
          transactions={
            data.transactions
          }
          investigationMap={
            investigationMap
          }
        />
      </div>

      {/* ======================================================
          GEOGRAPHIC / RECENT TRANSACTIONS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GeographicExposure
          transactions={
            data.transactions
          }
          investigationMap={
            investigationMap
          }
        />

        <div className="lg:col-span-2">
          <RecentTransactionsTable
            transactions={
              data.transactions
            }
            investigationMap={
              investigationMap
            }
          />
        </div>
      </div>

      {/* ======================================================
          SYSTEM FOOTER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-[9px] font-mono-tech text-lg-dim">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

          LEDGERGUARD LIVE INTELLIGENCE PIPELINE
        </div>

        <div className="flex items-center gap-3 text-[9px] font-mono-tech text-lg-dim">
          <span>
            TRANSACTIONS
          </span>

          <span>•</span>

          <span>
            RISK ENGINE
          </span>

          <span>•</span>

          <span>
            INVESTIGATIONS
          </span>

          <span>•</span>

          <span>
            RECOVERY
          </span>

          <span>•</span>

          <span>
            CHARGEBACKS
          </span>
        </div>
      </div>
    </div>
  );
}