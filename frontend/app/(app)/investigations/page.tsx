"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BrainCircuit,
  Check,
  X,
  ArrowUpRight,
  FileSearch,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Ban,
  UserCheck,
} from "lucide-react";

import {
  PageHeader,
  Card,
  RiskBadge,
  StatusBadge,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from "@/components/shared/page-primitives";

import {
  getInvestigations,
  getTransactions,
  updateInvestigationAction,
} from "@/lib/api";

type Investigation = {
  _id?: string;

  transaction_id: string;
  customer_id: string;
  merchant_id: string;

  risk_score: number;
  decision: string;
  severity: string;

  fraud_probability: number;
  ml_risk_score: number;
  rule_score: number;
  anomaly_score: number;

  triggered_rules: string[];
  evidence: string[];

  recommended_action: string;
  status: string;

  created_at: string;

  action?: string | null;
  analyst?: string | null;
  analyst_note?: string | null;
  previous_status?: string | null;
  updated_at?: string | null;
};

type Transaction = {
  transaction_id?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  location?: string;
  ip_address?: string;
  device_id?: string;
  status?: string;
};

type AnalystAction =
  | "APPROVE"
  | "REJECT"
  | "ESCALATE"
  | "FALSE_POSITIVE"
  | "REQUEST_MORE_EVIDENCE";

function formatMoney(
  amount: number,
  currency = "INR"
) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskLevel(
  severity?: string,
  score = 0
) {
  const value = severity?.toLowerCase();

  if (value === "critical" || score >= 80) {
    return "critical";
  }

  if (value === "high" || score >= 60) {
    return "high";
  }

  if (value === "medium" || score >= 30) {
    return "medium";
  }

  return "low";
}

function getPriority(
  severity?: string,
  score = 0
) {
  const value = severity?.toLowerCase();

  if (value === "critical" || score >= 80) {
    return "P1";
  }

  if (value === "high" || score >= 60) {
    return "P2";
  }

  if (value === "medium" || score >= 30) {
    return "P3";
  }

  return "P4";
}

function getStatusClass(status?: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "text-emerald-400";

    case "REJECTED":
      return "text-rose-400";

    case "ESCALATED":
      return "text-amber-400";

    case "FALSE_POSITIVE":
      return "text-blue-400";

    case "EVIDENCE_REQUIRED":
      return "text-violet-400";

    default:
      return "text-white";
  }
}

function getDecisionClass(
  decision?: string
) {
  switch (decision?.toUpperCase()) {
    case "BLOCK":
      return "text-rose-400";

    case "REVIEW":
      return "text-amber-400";

    case "ALLOW":
      return "text-emerald-400";

    default:
      return "text-white/70";
  }
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] =
    useState<Investigation[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [
    selectedInvestigation,
    setSelectedInvestigation,
  ] = useState<Investigation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [analystNote, setAnalystNote] =
    useState("");

  async function loadData(
    preserveSelection = false
  ) {
    try {
      setError("");

      const [
        investigationResponse,
        transactionResponse,
      ] = await Promise.all([
        getInvestigations(100),
        getTransactions(100),
      ]);

      const investigationData =
        Array.isArray(investigationResponse)
          ? investigationResponse
          : [];

      const transactionData =
        Array.isArray(transactionResponse)
          ? transactionResponse
          : [];

      setInvestigations(
        investigationData
      );

      setTransactions(
        transactionData
      );

      if (
        preserveSelection &&
        selectedInvestigation
      ) {
        const updated =
          investigationData.find(
            (item: Investigation) =>
              item._id ===
              selectedInvestigation._id
          );

        if (updated) {
          setSelectedInvestigation(
            updated
          );

          return;
        }
      }

      if (
        investigationData.length > 0
      ) {
        setSelectedInvestigation(
          investigationData[0]
        );
      } else {
        setSelectedInvestigation(null);
      }
    } catch (err) {
      console.error(
        "Failed to load investigation data:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load investigation data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval =
      setInterval(() => {
        loadData(true);
      }, 30000);

    return () =>
      clearInterval(interval);
  }, []);

  const transactionMap =
    useMemo(() => {
      const map = new Map<
        string,
        Transaction
      >();

      transactions.forEach((tx) => {
        if (tx.transaction_id) {
          map.set(
            tx.transaction_id,
            tx
          );
        }
      });

      return map;
    }, [transactions]);

  const filteredInvestigations =
    useMemo(() => {
      const value =
        query.trim().toLowerCase();

      if (!value) {
        return investigations;
      }

      return investigations.filter(
        (item) =>
          item.transaction_id
            ?.toLowerCase()
            .includes(value) ||
          item.customer_id
            ?.toLowerCase()
            .includes(value) ||
          item.merchant_id
            ?.toLowerCase()
            .includes(value) ||
          item.decision
            ?.toLowerCase()
            .includes(value) ||
          item.severity
            ?.toLowerCase()
            .includes(value) ||
          item.status
            ?.toLowerCase()
            .includes(value)
      );
    }, [investigations, query]);

  const stats = useMemo(() => {
    return {
      critical:
        investigations.filter(
          (item) =>
            getRiskLevel(
              item.severity,
              item.risk_score
            ) === "critical"
        ).length,

      high:
        investigations.filter(
          (item) =>
            getRiskLevel(
              item.severity,
              item.risk_score
            ) === "high"
        ).length,

      review:
        investigations.filter(
          (item) =>
            item.decision === "REVIEW"
        ).length,

      open:
        investigations.filter(
          (item) =>
            ![
              "APPROVED",
              "REJECTED",
              "FALSE_POSITIVE",
            ].includes(
              item.status?.toUpperCase()
            )
        ).length,
    };
  }, [investigations]);

  const current =
    selectedInvestigation;

  const currentTransaction =
    current
      ? transactionMap.get(
          current.transaction_id
        )
      : undefined;

  const exposure =
    currentTransaction?.amount ?? 0;

  async function handleAction(
    action: AnalystAction
  ) {
    if (!current?._id) {
      setActionError(
        "No investigation selected."
      );
      return;
    }

    if (
      action ===
        "REQUEST_MORE_EVIDENCE" &&
      !analystNote.trim()
    ) {
      setActionError(
        "Add an analyst note before requesting more evidence."
      );
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");
      setActionError("");

      const updated =
        await updateInvestigationAction(
          current._id,
          action,
          analystNote.trim() ||
            undefined
        );

      setSelectedInvestigation(
        updated
      );

      setInvestigations(
        (items) =>
          items.map((item) =>
            item._id === updated._id
              ? updated
              : item
          )
      );

      setAnalystNote("");

      setActionMessage(
        `${action
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(
            /^./,
            (char) =>
              char.toUpperCase()
          )} completed successfully.`
      );
    } catch (err) {
      console.error(
        "Investigation action failed:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update investigation."
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Investigation Center"
        subtitle="Case management, evidence review and analyst decisions"
        icon={Search}
      />

      {/* =====================================================
          COMMAND METRICS
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-tech text-lg-muted uppercase">
              Critical
            </span>

            <AlertTriangle
              size={14}
              className="text-rose-400"
            />
          </div>

          <div className="mt-2 text-xl font-bold font-mono-tech text-rose-400">
            {stats.critical}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-tech text-lg-muted uppercase">
              High
            </span>

            <ShieldCheck
              size={14}
              className="text-amber-400"
            />
          </div>

          <div className="mt-2 text-xl font-bold font-mono-tech text-amber-400">
            {stats.high}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-tech text-lg-muted uppercase">
              Review Queue
            </span>

            <FileSearch
              size={14}
              className="text-blue-400"
            />
          </div>

          <div className="mt-2 text-xl font-bold font-mono-tech text-blue-400">
            {stats.review}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-tech text-lg-muted uppercase">
              Open Cases
            </span>

            <Search
              size={14}
              className="text-emerald-400"
            />
          </div>

          <div className="mt-2 text-xl font-bold font-mono-tech text-emerald-400">
            {stats.open}
          </div>
        </Card>
      </div>

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-lg-muted"
        />

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search transaction, customer, merchant, severity, decision..."
          className="w-full bg-lg-surface border border-lg rounded-lg pl-9 pr-4 py-2.5 text-[11px] text-white placeholder:text-lg-muted focus:outline-none focus:border-blue-500/30"
        />
      </div>

      {/* =====================================================
          QUEUE
      ====================================================== */}

      <Card
        title="Investigation Queue"
        subtitle={`${filteredInvestigations.length} cases`}
        action={
          <button
            onClick={() => {
              setRefreshing(true);
              loadData(true);
            }}
            disabled={
              refreshing ||
              actionLoading
            }
            className="flex items-center gap-1.5 text-[10px] font-mono-tech text-lg-muted hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={12}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            REFRESH
          </button>
        }
      >
        {loading ? (
          <div className="py-16 text-center">
            <div className="text-[11px] font-mono-tech text-blue-400">
              LOADING INVESTIGATIONS...
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertTriangle
              size={24}
              className="mx-auto text-rose-400 mb-2"
            />

            <div className="text-sm text-rose-400">
              {error}
            </div>

            <button
              onClick={() =>
                loadData()
              }
              className="mt-3 px-3 py-1.5 border border-white/10 rounded text-[10px] font-mono-tech text-white/70 hover:text-white"
            >
              RETRY
            </button>
          </div>
        ) : filteredInvestigations.length ===
          0 ? (
          <div className="py-16 text-center">
            <Search
              size={28}
              className="mx-auto text-lg-muted mb-3"
            />

            <div className="text-sm text-white/70">
              No investigations found
            </div>

            <div className="text-[10px] font-mono-tech text-lg-muted mt-1">
              Run AI risk analysis on a transaction to create a case.
            </div>
          </div>
        ) : (
          <TableContainer>
            <thead>
              <tr>
                <Th>Transaction</Th>
                <Th>Customer</Th>
                <Th>Risk</Th>
                <Th className="text-right">
                  Exposure
                </Th>
                <Th>Decision</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Priority</Th>
              </tr>
            </thead>

            <tbody>
              {filteredInvestigations.map(
                (inv, index) => {
                  const level =
                    getRiskLevel(
                      inv.severity,
                      inv.risk_score
                    );

                  const priority =
                    getPriority(
                      inv.severity,
                      inv.risk_score
                    );

                  const tx =
                    transactionMap.get(
                      inv.transaction_id
                    );

                  return (
                    <motion.tr
                      key={
                        inv._id ||
                        inv.transaction_id
                      }
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay:
                          index * 0.025,
                      }}
                      onClick={() =>
                        setSelectedInvestigation(
                          inv
                        )
                      }
                      className={`border-b border-lg/50 hover:bg-white/[0.03] cursor-pointer transition-colors ${
                        selectedInvestigation?._id ===
                        inv._id
                          ? "bg-blue-500/[0.05]"
                          : ""
                      }`}
                    >
                      <Td className="font-mono-tech text-white">
                        {inv.transaction_id}
                      </Td>

                      <Td className="font-mono-tech text-lg-muted">
                        {inv.customer_id}
                      </Td>

                      <Td>
                        <RiskBadge
                          score={
                            inv.risk_score
                          }
                          level={level}
                        />
                      </Td>

                      <Td className="text-right font-mono-tech text-white">
                        {formatMoney(
                          tx?.amount ?? 0,
                          tx?.currency ||
                            "INR"
                        )}
                      </Td>

                      <Td>
                        <span
                          className={`text-[10px] font-mono-tech ${getDecisionClass(
                            inv.decision
                          )}`}
                        >
                          {inv.decision}
                        </span>
                      </Td>

                      <Td>
                        <StatusBadge
                          status={
                            inv.status
                          }
                        />
                      </Td>

                      <Td className="font-mono-tech text-lg-muted">
                        {formatDate(
                          inv.created_at
                        )}
                      </Td>

                      <Td>
                        <span
                          className={`text-[10px] font-mono-tech ${
                            priority === "P1"
                              ? "text-rose-400"
                              : priority === "P2"
                              ? "text-amber-400"
                              : priority === "P3"
                              ? "text-blue-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {priority}
                        </span>
                      </Td>
                    </motion.tr>
                  );
                }
              )}
            </tbody>
          </TableContainer>
        )}
      </Card>

      {/* =====================================================
          WORKSPACE
      ====================================================== */}

      {current && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
          {/* =================================================
              CASE TIMELINE
          ================================================== */}

          <Card
            title="Case Timeline"
            subtitle={`${current.transaction_id} — investigation lifecycle`}
          >
            <div className="space-y-0">
              <div className="flex gap-3 pb-5 relative">
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-lg" />

                <div className="shrink-0 mt-1 w-3.5 h-3.5 rounded-full border border-blue-500/30 bg-lg-surface flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono-tech text-white">
                      CASE CREATED
                    </span>

                    <span className="text-[9px] font-mono-tech text-lg-muted">
                      {formatDate(
                        current.created_at
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/60 mt-1">
                    Transaction entered the LedgerGuard investigation pipeline.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pb-5 relative">
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-lg" />

                <div className="shrink-0 mt-1 w-3.5 h-3.5 rounded-full border border-blue-500/30 bg-lg-surface flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                </div>

                <div>
                  <div className="text-[11px] font-mono-tech text-white">
                    AI RISK ASSESSMENT
                  </div>

                  <p className="text-[11px] text-white/60 mt-1">
                    Multi-signal engine generated a risk score of{" "}
                    <span className="text-blue-400 font-mono-tech">
                      {Number(
                        current.risk_score
                      ).toFixed(1)}
                    
                  </span>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pb-5 relative">
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-lg" />

                <div className="shrink-0 mt-1 w-3.5 h-3.5 rounded-full border border-blue-500/30 bg-lg-surface flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                </div>

                <div>
                  <div className="text-[11px] font-mono-tech text-white">
                    EVIDENCE GENERATED
                  </div>

                  <p className="text-[11px] text-white/60 mt-1">
                    {current.evidence?.length || 0} evidence signals attached to this case.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 mt-1 w-3.5 h-3.5 rounded-full border border-blue-500/30 bg-lg-surface flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono-tech text-white">
                      CURRENT STATE
                    </span>

                    <span
                      className={`text-[10px] font-mono-tech ${getStatusClass(
                        current.status
                      )}`}
                    >
                      {current.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/60 mt-1">
                    Recommended action:{" "}
                    <span className="text-white/80">
                      {current.recommended_action}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* =================================================
              AI REPORT
          ================================================== */}

          <Card
            title="AI Investigation Report"
            subtitle={`${current.transaction_id} — automated evidence analysis`}
            action={
              <span className="text-[10px] font-mono-tech text-lg-muted">
                FRAUD PROBABILITY{" "}
                <span className="text-emerald-400">
                  {(
                    Number(
                      current.fraud_probability
                    ) * 100
                  ).toFixed(1)}
                  %
                </span>
              </span>
            }
          >
            <div className="space-y-3">
              {/* Summary */}

              <div className="flex items-start gap-2">
                <BrainCircuit
                  size={14}
                  className="text-lg-blue shrink-0 mt-0.5"
                />

                <div>
                  <div className="text-[10px] font-mono-tech text-lg-blue uppercase mb-1">
                    Executive Summary
                  </div>

                  <p className="text-[11px] text-white/80 leading-relaxed">
                    Transaction{" "}
                    <span className="font-mono-tech text-white">
                      {current.transaction_id}
                    </span>{" "}
                    received a risk score of{" "}
                    <span className="text-blue-400 font-mono-tech">
                      {Number(
                        current.risk_score
                      ).toFixed(1)}
                    </span>
                    {" "}and was classified as{" "}
                    <span className="text-amber-400 font-mono-tech">
                      {current.severity?.toUpperCase()}
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* Transaction context */}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.02] rounded-md p-2.5">
                  <div className="text-[9px] font-mono-tech text-lg-muted">
                    TRANSACTION VALUE
                  </div>

                  <div className="mt-1 text-sm font-bold font-mono-tech text-white">
                    {formatMoney(
                      exposure,
                      currentTransaction?.currency ||
                        "INR"
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.02] rounded-md p-2.5">
                  <div className="text-[9px] font-mono-tech text-lg-muted">
                    PAYMENT METHOD
                  </div>

                  <div className="mt-1 text-sm font-bold font-mono-tech text-white">
                    {currentTransaction?.payment_method ||
                      "UNKNOWN"}
                  </div>
                </div>

                <div className="bg-white/[0.02] rounded-md p-2.5">
                  <div className="text-[9px] font-mono-tech text-lg-muted">
                    LOCATION
                  </div>

                  <div className="mt-1 text-[11px] text-white/80">
                    {currentTransaction?.location ||
                      "Unknown"}
                  </div>
                </div>

                <div className="bg-white/[0.02] rounded-md p-2.5">
                  <div className="text-[9px] font-mono-tech text-lg-muted">
                    DEVICE
                  </div>

                  <div className="mt-1 text-[11px] font-mono-tech text-white/80">
                    {currentTransaction?.device_id ||
                      "—"}
                  </div>
                </div>
              </div>

              {/* Signal breakdown */}

              <div>
                <div className="text-[10px] font-mono-tech text-lg-muted uppercase mb-1.5">
                  Signal Breakdown
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.02] rounded-md p-2">
                    <div className="text-[9px] font-mono-tech text-lg-muted">
                      ML MODEL
                    </div>

                    <div className="text-sm font-bold font-mono-tech text-blue-400">
                      {Number(
                        current.ml_risk_score
                      ).toFixed(1)}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] rounded-md p-2">
                    <div className="text-[9px] font-mono-tech text-lg-muted">
                      RULE ENGINE
                    </div>

                    <div className="text-sm font-bold font-mono-tech text-amber-400">
                      {Number(
                        current.rule_score
                      ).toFixed(1)}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] rounded-md p-2">
                    <div className="text-[9px] font-mono-tech text-lg-muted">
                      ANOMALY
                    </div>

                    <div className="text-sm font-bold font-mono-tech text-rose-400">
                      {Number(
                        current.anomaly_score
                      ).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence */}

              <div>
                <div className="text-[10px] font-mono-tech text-lg-muted uppercase mb-1.5">
                  Evidence Signals
                </div>

                {current.evidence?.length ? (
                  <ul className="space-y-1.5">
                    {current.evidence.map(
                      (evidence, index) => (
                        <li
                          key={`${evidence}-${index}`}
                          className="flex items-start gap-2 text-[11px] text-white/70"
                        >
                          <span className="text-emerald-400 mt-0.5">
                            ✓
                          </span>

                          <span>
                            {evidence}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <div className="text-[10px] text-lg-muted">
                    No evidence signals recorded.
                  </div>
                )}
              </div>

              {/* Triggered rules */}

              {current.triggered_rules?.length >
                0 && (
                <div>
                  <div className="text-[10px] font-mono-tech text-lg-muted uppercase mb-1.5">
                    Triggered Rules
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {current.triggered_rules.map(
                      (rule) => (
                        <span
                          key={rule}
                          className="px-2 py-1 rounded border border-rose-500/20 bg-rose-500/5 text-[9px] font-mono-tech text-rose-400"
                        >
                          {rule}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}

              <div className="bg-blue-500/5 border border-blue-500/15 rounded-md p-2.5">
                <div className="text-[10px] font-mono-tech text-lg-blue uppercase mb-0.5">
                  Recommended Action
                </div>

                <div className="text-[11px] text-white/80">
                  {current.recommended_action ||
                    "No recommendation available."}
                </div>
              </div>

              {/* Exposure */}

              <div className="flex items-center justify-between bg-white/[0.02] rounded-md p-2.5">
                <span className="text-[10px] font-mono-tech text-lg-muted uppercase">
                  Actual Transaction Exposure
                </span>

                <span className="text-sm font-bold text-amber-400 font-mono-tech">
                  {formatMoney(
                    exposure,
                    currentTransaction?.currency ||
                      "INR"
                  )}
                </span>
              </div>

              {/* Last action */}

              {current.action && (
                <div className="border border-white/10 bg-white/[0.02] rounded-md p-2.5">
                  <div className="text-[10px] font-mono-tech text-lg-muted uppercase mb-1">
                    Last Analyst Action
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-[11px] font-mono-tech ${getStatusClass(
                        current.status
                      )}`}
                    >
                      {current.action.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    {current.analyst && (
                      <span className="text-[9px] font-mono-tech text-lg-muted">
                        {current.analyst}
                      </span>
                    )}
                  </div>

                  {current.analyst_note && (
                    <div className="mt-2 text-[10px] text-white/60">
                      {current.analyst_note}
                    </div>
                  )}

                  {current.updated_at && (
                    <div className="mt-1 text-[9px] font-mono-tech text-lg-muted">
                      {formatDate(
                        current.updated_at
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                  ANALYST CONTROLS
              ================================================== */}

              <div>
                <div className="text-[10px] font-mono-tech text-lg-muted uppercase mb-2">
                  Analyst Decision
                </div>

                {actionMessage && (
                  <div className="mb-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[10px] font-mono-tech text-emerald-400">
                    {actionMessage}
                  </div>
                )}

                {actionError && (
                  <div className="mb-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[10px] font-mono-tech text-rose-400">
                    {actionError}
                  </div>
                )}

                <textarea
                  value={analystNote}
                  onChange={(event) =>
                    setAnalystNote(
                      event.target.value
                    )
                  }
                  disabled={
                    actionLoading
                  }
                  placeholder="Add analyst note, investigation rationale or evidence request..."
                  className="w-full mb-2 min-h-[70px] resize-none rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] font-mono-tech text-white placeholder:text-white/30 outline-none focus:border-blue-500/30 disabled:opacity-50"
                />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      handleAction(
                        "APPROVE"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[10px] font-mono-tech border rounded text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 disabled:opacity-40"
                  >
                    <Check size={12} />
                    APPROVE
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        "REJECT"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[10px] font-mono-tech border rounded text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15 disabled:opacity-40"
                  >
                    <X size={12} />
                    REJECT
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        "ESCALATE"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[10px] font-mono-tech border rounded text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15 disabled:opacity-40"
                  >
                    <ArrowUpRight
                      size={12}
                    />
                    ESCALATE
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        "FALSE_POSITIVE"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[10px] font-mono-tech border rounded text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 disabled:opacity-40"
                  >
                    <UserCheck
                      size={12}
                    />
                    FALSE POSITIVE
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        "REQUEST_MORE_EVIDENCE"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[10px] font-mono-tech border rounded text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15 disabled:opacity-40"
                  >
                    <FileSearch
                      size={12}
                    />
                    REQUEST EVIDENCE
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        "REJECT"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[10px] font-mono-tech border rounded text-rose-300 bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10 disabled:opacity-40"
                  >
                    <Ban size={12} />
                    CONFIRM BLOCK
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}