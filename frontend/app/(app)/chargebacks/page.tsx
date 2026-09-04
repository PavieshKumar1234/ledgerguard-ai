
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileWarning,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  XCircle,
  Search,
  CalendarDays,
  User,
  Store,
  CreditCard,
} from "lucide-react";

import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from "@/components/shared/page-primitives";

import { getChargebacks } from "@/lib/api";

// ============================================================
// TYPES
// ============================================================

type Chargeback = {
  _id?: string;

  id?: string;
  chargeback_id?: string;

  transaction_id?: string;
  transaction?: string;

  customer_id?: string;
  customer?: string;

  merchant_id?: string;
  merchant?: string;

  amount?: number;
  disputed_amount?: number;

  reason?: string;
  reason_code?: string;

  status?: string;

  created_at?: string;
  deadline?: string;

  evidence_score?: number;
  evidenceScore?: number;

  win_probability?: number;
  winProbability?: number;

  evidence?: string[];
  missing_evidence?: string[];

  recommended_action?: string;
};

// ============================================================
// HELPERS
// ============================================================

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date?: string) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getId = (cb: Chargeback) =>
  cb.chargeback_id ||
  cb.id ||
  cb._id ||
  "—";

const getTransactionId = (
  cb: Chargeback
) =>
  cb.transaction_id ||
  cb.transaction ||
  "—";

const getCustomerId = (
  cb: Chargeback
) =>
  cb.customer_id ||
  cb.customer ||
  "—";

const getMerchantId = (
  cb: Chargeback
) =>
  cb.merchant_id ||
  cb.merchant ||
  "—";

const getAmount = (cb: Chargeback) =>
  Number(
    cb.disputed_amount ??
      cb.amount ??
      0
  );

const getEvidenceScore = (
  cb: Chargeback
) => {
  const value =
    cb.evidence_score ??
    cb.evidenceScore;

  return typeof value === "number"
    ? Math.max(
        0,
        Math.min(100, value)
      )
    : null;
};

const getWinProbability = (
  cb: Chargeback
) => {
  const value =
    cb.win_probability ??
    cb.winProbability;

  return typeof value === "number"
    ? Math.max(
        0,
        Math.min(100, value)
      )
    : null;
};

const normalizeStatus = (
  status?: string
) =>
  (status || "OPEN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

const isResolved = (
  status?: string
) => {
  const value =
    status?.toUpperCase();

  return [
    "RESOLVED",
    "WON",
    "CLOSED",
    "RECOVERED",
    "COMPLETED",
  ].includes(value || "");
};

const isFailed = (
  status?: string
) => {
  const value =
    status?.toUpperCase();

  return [
    "LOST",
    "FAILED",
    "CANCELLED",
    "REJECTED",
  ].includes(value || "");
};

// ============================================================
// EVIDENCE SCORE
// ============================================================

function EvidenceBar({
  score,
}: {
  score: number | null;
}) {
  if (score === null) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono-tech text-white/30">
        <AlertCircle size={10} />
        Not available
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded bg-white/[0.04]">
        <div
          className={`h-full rounded ${
            score >= 80
              ? "bg-emerald-500/60"
              : score >= 50
                ? "bg-amber-500/60"
                : "bg-rose-500/60"
          }`}
          style={{
            width: `${score}%`,
          }}
        />
      </div>

      <span className="text-[10px] font-mono-tech text-white/50">
        {score}%
      </span>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function ChargebacksPage() {
  const [chargebacks, setChargebacks] =
    useState<Chargeback[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedChargeback, setSelectedChargeback] =
    useState<Chargeback | null>(null);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  async function loadChargebacks() {
    try {
      setError("");

      const data =
        await getChargebacks(100);

      setChargebacks(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load chargebacks:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load chargeback data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadChargebacks();

    const interval =
      window.setInterval(() => {
        loadChargebacks();
      }, 30000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredChargebacks =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return chargebacks;
      }

      return chargebacks.filter(
        (cb) =>
          getId(cb)
            .toLowerCase()
            .includes(query) ||
          getTransactionId(cb)
            .toLowerCase()
            .includes(query) ||
          getCustomerId(cb)
            .toLowerCase()
            .includes(query) ||
          getMerchantId(cb)
            .toLowerCase()
            .includes(query) ||
          (cb.reason || "")
            .toLowerCase()
            .includes(query) ||
          (cb.reason_code || "")
            .toLowerCase()
            .includes(query) ||
          (cb.status || "")
            .toLowerCase()
            .includes(query)
      );
    }, [chargebacks, search]);

  // ==========================================================
  // LIVE KPIs
  // ==========================================================

  const kpis = useMemo(() => {
    const totalExposure =
      chargebacks.reduce(
        (sum, cb) =>
          sum + getAmount(cb),
        0
      );

    const openCases =
      chargebacks.filter(
        (cb) =>
          !isResolved(cb.status) &&
          !isFailed(cb.status)
      ).length;

    const resolvedCases =
      chargebacks.filter(
        (cb) =>
          isResolved(cb.status)
      ).length;

    const lostCases =
      chargebacks.filter(
        (cb) =>
          isFailed(cb.status)
      ).length;

    const scoredCases =
      chargebacks.filter(
        (cb) =>
          getWinProbability(cb) !==
          null
      );

    const averageWinProbability =
      scoredCases.length > 0
        ? scoredCases.reduce(
            (sum, cb) =>
              sum +
              (getWinProbability(
                cb
              ) || 0),
            0
          ) / scoredCases.length
        : 0;

    const resolvedExposure =
      chargebacks
        .filter((cb) =>
          isResolved(cb.status)
        )
        .reduce(
          (sum, cb) =>
            sum + getAmount(cb),
          0
        );

    const winRate =
      resolvedCases + lostCases >
      0
        ? (resolvedCases /
            (resolvedCases +
              lostCases)) *
          100
        : 0;

    return {
      totalExposure,
      openCases,
      resolvedCases,
      lostCases,
      averageWinProbability,
      resolvedExposure,
      winRate,
    };
  }, [chargebacks]);

  // ==========================================================
  // SELECTED CASE
  // ==========================================================

  const selectedEvidenceScore =
    selectedChargeback
      ? getEvidenceScore(
          selectedChargeback
        )
      : null;

  const selectedWinProbability =
    selectedChargeback
      ? getWinProbability(
          selectedChargeback
        )
      : null;

  const selectedAmount =
    selectedChargeback
      ? getAmount(
          selectedChargeback
        )
      : 0;

  const selectedEvidence =
    selectedChargeback?.evidence ||
    [];

  const selectedMissingEvidence =
    selectedChargeback?.missing_evidence ||
    [];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <PageContainer>
      <PageHeader
        title="Chargeback Defense"
        subtitle="Dispute management and chargeback exposure intelligence"
        icon={FileWarning}
      />

      {/* ======================================================
          REFRESH + SEARCH
      ====================================================== */}

      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row">
        <div className="relative max-w-md flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search chargebacks, transactions, customers..."
            className="w-full rounded-md border border-white/10 bg-white/[0.02] py-2 pl-9 pr-3 text-[11px] font-mono-tech text-white outline-none placeholder:text-white/25 focus:border-blue-400/30"
          />
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadChargebacks();
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-mono-tech text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />
          Refresh Chargebacks
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-rose-400/20 bg-rose-400/[0.05] p-3">
          <AlertCircle
            size={16}
            className="mt-0.5 text-rose-400"
          />

          <div className="flex-1">
            <div className="text-xs font-mono-tech text-rose-300">
              CHARGEBACK DATA ERROR
            </div>

            <div className="mt-1 text-[11px] text-white/50">
              {error}
            </div>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              loadChargebacks();
            }}
            className="text-[10px] font-mono-tech text-blue-400 hover:text-blue-300"
          >
            RETRY
          </button>
        </div>
      )}

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Dispute Exposure"
          value={kpis.totalExposure}
          change={chargebacks.length}
          trend="up"
          color="red"
        />

        <StatCard
          label="Open Cases"
          value={kpis.openCases}
          change={kpis.openCases}
          trend={
            kpis.openCases > 0
              ? "down"
              : "up"
          }
          color="amber"
        />

        <StatCard
          label="Resolved"
          value={kpis.resolvedCases}
          change={kpis.resolvedCases}
          trend="up"
          color="green"
        />

        <StatCard
          label="Lost / Failed"
          value={kpis.lostCases}
          change={kpis.lostCases}
          trend={
            kpis.lostCases > 0
              ? "down"
              : "up"
          }
          color="red"
        />

        <StatCard
          label="Avg Win Probability"
          value={
            kpis.averageWinProbability
          }
          change={
            kpis.averageWinProbability
          }
          trend={
            kpis.averageWinProbability >=
            50
              ? "up"
              : "down"
          }
          color="cyan"
          isPercentage
        />

        <StatCard
          label="Win Rate"
          value={kpis.winRate}
          change={kpis.winRate}
          trend={
            kpis.winRate >= 50
              ? "up"
              : "down"
          }
          color="green"
          isPercentage
        />
      </div>

      {/* ======================================================
          CHARGEBACK QUEUE
      ====================================================== */}

      <Card
        title="Chargeback Case Queue"
        subtitle="Live disputes returned by the LedgerGuard API"
        className="mt-4"
        action={
          <span className="text-[10px] font-mono-tech text-blue-400">
            {filteredChargebacks.length} CASES
          </span>
        }
      >
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw
              size={22}
              className="mx-auto animate-spin text-blue-400"
            />

            <div className="mt-3 text-[11px] font-mono-tech text-white/40">
              LOADING CHARGEBACK CASES...
            </div>
          </div>
        ) : filteredChargebacks.length ===
          0 ? (
          <div className="py-16 text-center">
            <ShieldCheck
              size={28}
              className="mx-auto text-white/20"
            />

            <div className="mt-3 text-sm text-white/50">
              {chargebacks.length ===
              0
                ? "No chargeback cases found"
                : "No matching chargeback cases"}
            </div>

            <div className="mt-1 text-[10px] font-mono-tech text-white/30">
              Chargeback records will
              appear here when available.
            </div>
          </div>
        ) : (
          <TableContainer>
            <thead>
              <tr>
                <Th>Chargeback</Th>
                <Th>Transaction</Th>
                <Th>Customer</Th>
                <Th className="text-right">
                  Amount
                </Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Evidence</Th>
                <Th>Created</Th>
                <Th className="text-right">
                  Win Probability
                </Th>
              </tr>
            </thead>

            <tbody>
              {filteredChargebacks.map(
                (cb, index) => {
                  const evidenceScore =
                    getEvidenceScore(cb);

                  const winProbability =
                    getWinProbability(cb);

                  const selected =
                    selectedChargeback?._id ===
                      cb._id ||
                    getId(
                      selectedChargeback ||
                        {}
                    ) === getId(cb);

                  return (
                    <motion.tr
                      key={
                        cb._id ||
                        getId(cb) ||
                        index
                      }
                      initial={{
                        opacity: 0,
                        y: 4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay:
                          index * 0.025,
                      }}
                      onClick={() =>
                        setSelectedChargeback(
                          cb
                        )
                      }
                      className={`cursor-pointer border-b border-white/[0.04] transition-colors ${
                        selected
                          ? "bg-blue-500/[0.06]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <Td>
                        <span className="font-mono-tech text-blue-400">
                          {getId(cb)}
                        </span>
                      </Td>

                      <Td>
                        <span className="font-mono-tech text-white/70">
                          {getTransactionId(
                            cb
                          )}
                        </span>
                      </Td>

                      <Td>
                        <span className="font-mono-tech text-white/50">
                          {getCustomerId(
                            cb
                          )}
                        </span>
                      </Td>

                      <Td className="text-right font-mono-tech text-white">
                        {formatINR(
                          getAmount(cb)
                        )}
                      </Td>

                      <Td>
                        <div className="max-w-[180px]">
                          <div className="text-xs text-white/70">
                            {cb.reason ||
                              "—"}
                          </div>

                          {cb.reason_code && (
                            <div className="mt-1 text-[9px] font-mono-tech text-white/30">
                              CODE{" "}
                              {
                                cb.reason_code
                              }
                            </div>
                          )}
                        </div>
                      </Td>

                      <Td>
                        <StatusBadge
                          status={
                            cb.status ||
                            "OPEN"
                          }
                        />
                      </Td>

                      <Td>
                        <EvidenceBar
                          score={
                            evidenceScore
                          }
                        />
                      </Td>

                      <Td className="text-[10px] font-mono-tech text-white/40">
                        {formatDate(
                          cb.created_at
                        )}
                      </Td>

                      <Td className="text-right">
                        {winProbability !==
                        null ? (
                          <span
                            className={`text-[10px] font-mono-tech ${
                              winProbability >=
                              70
                                ? "text-emerald-400"
                                : winProbability >=
                                    40
                                  ? "text-amber-400"
                                  : "text-rose-400"
                            }`}
                          >
                            {winProbability}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono-tech text-white/25">
                            —
                          </span>
                        )}
                      </Td>
                    </motion.tr>
                  );
                }
              )}
            </tbody>
          </TableContainer>
        )}
      </Card>

      {/* ======================================================
          SELECTED CASE
      ====================================================== */}

      {selectedChargeback && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* CASE OVERVIEW */}

          <Card
            title="Chargeback Investigation"
            subtitle="Selected dispute intelligence"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Chargeback
                </div>

                <div className="mt-1 text-sm font-mono-tech text-blue-400">
                  {getId(
                    selectedChargeback
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Transaction
                </div>

                <div className="mt-1 text-sm font-mono-tech text-white">
                  {getTransactionId(
                    selectedChargeback
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Disputed Amount
                </div>

                <div className="mt-1 text-sm font-mono-tech text-rose-400">
                  {formatINR(
                    selectedAmount
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Status
                </div>

                <div className="mt-1 text-sm font-mono-tech text-white">
                  {normalizeStatus(
                    selectedChargeback.status
                  )}
                </div>
              </div>
            </div>

            {/* CUSTOMER / MERCHANT */}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[9px] font-mono-tech uppercase text-white/30">
                  <User size={11} />
                  Customer
                </div>

                <div className="mt-2 text-xs font-mono-tech text-white/70">
                  {getCustomerId(
                    selectedChargeback
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[9px] font-mono-tech uppercase text-white/30">
                  <Store size={11} />
                  Merchant
                </div>

                <div className="mt-2 text-xs font-mono-tech text-white/70">
                  {getMerchantId(
                    selectedChargeback
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[9px] font-mono-tech uppercase text-white/30">
                  <CreditCard size={11} />
                  Reason
                </div>

                <div className="mt-2 text-xs text-white/70">
                  {selectedChargeback.reason ||
                    selectedChargeback.reason_code ||
                    "—"}
                </div>
              </div>
            </div>

            {/* ANALYTICS */}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
                    Evidence Score
                  </span>

                  <span className="text-sm font-mono-tech text-cyan-400">
                    {selectedEvidenceScore !==
                    null
                      ? `${selectedEvidenceScore}%`
                      : "N/A"}
                  </span>
                </div>

                <EvidenceBar
                  score={
                    selectedEvidenceScore
                  }
                />
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
                    Win Probability
                  </span>

                  <span className="text-sm font-mono-tech text-emerald-400">
                    {selectedWinProbability !==
                    null
                      ? `${selectedWinProbability}%`
                      : "N/A"}
                  </span>
                </div>

                {selectedWinProbability !==
                null ? (
                  <div className="h-1.5 overflow-hidden rounded bg-white/[0.04]">
                    <div
                      className="h-full rounded bg-emerald-500/60"
                      style={{
                        width: `${selectedWinProbability}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-[10px] font-mono-tech text-white/25">
                    Backend has not supplied a
                    prediction.
                  </div>
                )}
              </div>
            </div>

            {/* RECOMMENDATION */}

            {selectedChargeback.recommended_action && (
              <div className="mt-4 rounded-md border border-blue-400/10 bg-blue-500/[0.03] p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={13}
                    className="text-blue-400"
                  />

                  <span className="text-[10px] font-mono-tech uppercase tracking-wider text-blue-400/80">
                    Recommended Defense Action
                  </span>
                </div>

                <div className="mt-2 text-xs text-white/70">
                  {
                    selectedChargeback.recommended_action
                  }
                </div>
              </div>
            )}
          </Card>

          {/* EVIDENCE */}

          <Card
            title="Evidence Intelligence"
            subtitle="Available dispute evidence"
            action={
              <Eye
                size={14}
                className="text-blue-400"
              />
            }
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2
                    size={13}
                    className="text-emerald-400"
                  />

                  <span className="text-[10px] font-mono-tech uppercase tracking-wider text-white/50">
                    Available Evidence
                  </span>
                </div>

                {selectedEvidence.length >
                0 ? (
                  <div className="space-y-2">
                    {selectedEvidence.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-md border border-emerald-400/10 bg-emerald-400/[0.03] p-2.5 text-[11px] text-white/60"
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3 text-[10px] font-mono-tech text-white/30">
                    No evidence records were
                    returned by the backend.
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle
                    size={13}
                    className="text-amber-400"
                  />

                  <span className="text-[10px] font-mono-tech uppercase tracking-wider text-white/50">
                    Missing Evidence
                  </span>
                </div>

                {selectedMissingEvidence.length >
                0 ? (
                  <div className="space-y-2">
                    {selectedMissingEvidence.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-md border border-amber-400/10 bg-amber-400/[0.03] p-2.5 text-[11px] text-white/60"
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3 text-[10px] font-mono-tech text-white/30">
                    No missing-evidence list was
                    returned.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================
          DEFENSE OPERATIONS
      ====================================================== */}

      <Card
        title="Defense Operations"
        subtitle="Current chargeback portfolio position"
        className="mt-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
              <IndianRupee size={12} />
              Resolved Exposure
            </div>

            <div className="mt-2 text-xl font-bold text-emerald-400">
              {formatINR(
                kpis.resolvedExposure
              )}
            </div>
          </div>

          <div className="rounded-md border border-amber-400/10 bg-amber-400/[0.02] p-4">
            <div className="flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-wider text-amber-400/70">
              <Clock size={12} />
              Active Defense Queue
            </div>

            <div className="mt-2 text-xl font-bold text-amber-400">
              {kpis.openCases}
            </div>
          </div>

          <div className="rounded-md border border-blue-400/10 bg-blue-500/[0.02] p-4">
            <div className="flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-wider text-blue-400/70">
              <ShieldCheck size={12} />
              Portfolio Win Rate
            </div>

            <div className="mt-2 text-xl font-bold text-blue-400">
              {kpis.winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.015] px-3 py-2">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={12}
            className="text-white/30"
          />

          <span className="text-[9px] font-mono-tech text-white/30">
            LIVE DATA · AUTO REFRESH 30S
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-[9px] font-mono-tech text-emerald-400/70">
            CHARGEBACK ENGINE ONLINE
          </span>
        </div>
      </div>
    </PageContainer>
  );
}
