
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  IndianRupee,
  ShieldCheck,
  Target,
  ArrowUpRight,
  XCircle,
} from "lucide-react";

import {
  PageHeader,
  Card,
  StatCard,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from "@/components/shared/page-primitives";

import {
  getRecoveries,
  completeRecovery,
} from "@/lib/api";

type Recovery = {
  _id?: string;
  transaction_id: string;
  original_amount: number;
  recovered_amount: number;
  status: string;
  created_at: string;

  customer_id?: string;
  merchant_id?: string;

  recovery_probability?: number;
  recommended_action?: string;
};

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

const getStatusClass = (status: string) => {
  const normalized = status?.toUpperCase();

  if (normalized === "RECOVERED") {
    return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  }

  if (
    normalized === "FAILED" ||
    normalized === "CANCELLED"
  ) {
    return "text-rose-400 border-rose-400/30 bg-rose-400/10";
  }

  return "text-amber-400 border-amber-400/30 bg-amber-400/10";
};

const getStatusLabel = (status: string) =>
  (status || "PENDING")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

function ProgressBar({
  value,
}: {
  value: number;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{ duration: 0.6 }}
        className="h-full rounded-full bg-gradient-to-r from-blue-500/70 to-cyan-400/70"
      />
    </div>
  );
}

export default function RevenueRecoveryPage() {
  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedRecovery, setSelectedRecovery] =
    useState<Recovery | null>(null);

  const [recoveredAmount, setRecoveredAmount] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  async function loadRecoveries(
    preserveSelection = false
  ) {
    try {
      setError("");

      const data = await getRecoveries(100);

      const normalized: Recovery[] =
        Array.isArray(data) ? data : [];

      setRecoveries(normalized);

      if (preserveSelection) {
        setSelectedRecovery((current) => {
          if (!current?._id) {
            return current;
          }

          return (
            normalized.find(
              (item) =>
                item._id === current._id
            ) || null
          );
        });
      }
    } catch (err) {
      console.error(
        "Failed to load recoveries:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recovery cases."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRecoveries();

    const interval = window.setInterval(() => {
      loadRecoveries(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const totalExposure = recoveries.reduce(
      (sum, item) =>
        sum + Number(item.original_amount || 0),
      0
    );

    const recovered = recoveries.reduce(
      (sum, item) =>
        sum + Number(item.recovered_amount || 0),
      0
    );

    const outstanding = Math.max(
      totalExposure - recovered,
      0
    );

    const recoveryRate =
      totalExposure > 0
        ? (recovered / totalExposure) * 100
        : 0;

    const recoveredCases = recoveries.filter(
      (item) =>
        item.status?.toUpperCase() ===
        "RECOVERED"
    ).length;

    const failedCases = recoveries.filter(
      (item) =>
        item.status?.toUpperCase() ===
          "FAILED" ||
        item.status?.toUpperCase() ===
          "CANCELLED"
    ).length;

    const pendingCases = recoveries.filter(
      (item) => {
        const status =
          item.status?.toUpperCase();

        return (
          status !== "RECOVERED" &&
          status !== "FAILED" &&
          status !== "CANCELLED"
        );
      }
    ).length;

    return {
      totalExposure,
      recovered,
      outstanding,
      recoveryRate,
      recoveredCases,
      failedCases,
      pendingCases,
    };
  }, [recoveries]);

  const opportunityData = useMemo(() => {
    return recoveries
      .map((item) => {
        const original =
          Number(item.original_amount || 0);

        const recovered =
          Number(item.recovered_amount || 0);

        const outstanding = Math.max(
          original - recovered,
          0
        );

        /*
         * Only use recovery_probability when
         * it actually exists in the backend.
         *
         * Otherwise this represents recovery
         * progress, NOT a predicted probability.
         */
        const progress =
          original > 0
            ? (recovered / original) * 100
            : 0;

        const probability =
          typeof item.recovery_probability ===
          "number"
            ? Math.max(
                0,
                Math.min(
                  100,
                  item.recovery_probability
                )
              )
            : null;

        return {
          id: item._id,
          transaction_id:
            item.transaction_id,
          exposure: outstanding,
          progress,
          probability,
        };
      })
      .filter((item) => item.exposure > 0)
      .sort(
        (a, b) =>
          b.exposure - a.exposure
      )
      .slice(0, 8);
  }, [recoveries]);

  function selectRecovery(
    recovery: Recovery
  ) {
    setSelectedRecovery(recovery);

    setRecoveredAmount(
      String(
        Number(
          recovery.recovered_amount || 0
        )
      )
    );

    setActionMessage("");
    setActionError("");
  }

  async function handleCompleteRecovery() {
    if (!selectedRecovery?._id) {
      setActionError(
        "No recovery case selected."
      );
      return;
    }

    setActionError("");
    setActionMessage("");

    const amount = Number(
      recoveredAmount
    );

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setActionError(
        "Enter a valid recovered amount."
      );
      return;
    }

    const originalAmount =
      Number(
        selectedRecovery.original_amount ||
          0
      );

    if (amount > originalAmount) {
      setActionError(
        "Recovered amount cannot exceed the original amount."
      );
      return;
    }

    setActionLoading(true);

    try {
      await completeRecovery(
        selectedRecovery._id,
        amount
      );

      setActionMessage(
        "Recovery updated successfully."
      );

      await loadRecoveries(true);
    } catch (err) {
      console.error(
        "Recovery completion failed:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to complete recovery."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const selectedOriginalAmount =
    Number(
      selectedRecovery?.original_amount ||
        0
    );

  const selectedRecoveredAmount =
    Number(
      selectedRecovery?.recovered_amount ||
        0
    );

  const selectedOutstanding =
    Math.max(
      selectedOriginalAmount -
        selectedRecoveredAmount,
      0
    );

  const selectedRecoveryRate =
    selectedOriginalAmount > 0
      ? Math.min(
          100,
          (selectedRecoveredAmount /
            selectedOriginalAmount) *
            100
        )
      : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Revenue Recovery"
        subtitle="Financial recovery operations and revenue exposure management"
        icon={TrendingUp}
      />

      <div className="flex justify-end -mt-2 mb-4">
        <button
          onClick={() => {
            setRefreshing(true);
            loadRecoveries(true);
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-mono-tech text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />
          Refresh Recovery Data
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-rose-400/20 bg-rose-400/[0.05] p-3">
          <AlertTriangle
            size={16}
            className="mt-0.5 text-rose-400"
          />

          <div className="flex-1">
            <div className="text-xs font-mono-tech text-rose-300">
              RECOVERY DATA ERROR
            </div>

            <div className="mt-1 text-[11px] text-white/50">
              {error}
            </div>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              loadRecoveries();
            }}
            className="text-[10px] font-mono-tech text-blue-400 hover:text-blue-300"
          >
            RETRY
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Exposure"
          value={stats.totalExposure}
          change={recoveries.length}
          trend="up"
          color="blue"
        />

        <StatCard
          label="Recovered Revenue"
          value={stats.recovered}
          change={stats.recoveredCases}
          trend="up"
          color="green"
        />

        <StatCard
          label="Outstanding"
          value={stats.outstanding}
          change={stats.pendingCases}
          trend="down"
          color="red"
        />

        <StatCard
          label="Recovery Rate"
          value={stats.recoveryRate}
          change={stats.recoveryRate}
          trend={
            stats.recoveryRate >= 50
              ? "up"
              : "down"
          }
          color="cyan"
          isPercentage
        />

        <StatCard
          label="Active Cases"
          value={stats.pendingCases}
          change={stats.pendingCases}
          trend="down"
          color="amber"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Recovery Exposure"
          subtitle="Current financial position"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
                <IndianRupee size={12} />
                Total Exposure
              </div>

              <div className="mt-2 text-2xl font-bold text-white">
                {formatINR(
                  stats.totalExposure
                )}
              </div>
            </div>

            <div className="rounded-md border border-emerald-400/10 bg-emerald-400/[0.03] p-4">
              <div className="flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-wider text-emerald-400/70">
                <CheckCircle2 size={12} />
                Recovered
              </div>

              <div className="mt-2 text-2xl font-bold text-emerald-400">
                {formatINR(
                  stats.recovered
                )}
              </div>
            </div>

            <div className="rounded-md border border-rose-400/10 bg-rose-400/[0.03] p-4">
              <div className="flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-wider text-rose-400/70">
                <AlertTriangle size={12} />
                Outstanding
              </div>

              <div className="mt-2 text-2xl font-bold text-rose-400">
                {formatINR(
                  stats.outstanding
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
                Portfolio Recovery Progress
              </span>

              <span className="text-[11px] font-mono-tech text-cyan-400">
                {stats.recoveryRate.toFixed(1)}%
              </span>
            </div>

            <ProgressBar
              value={stats.recoveryRate}
            />
          </div>
        </Card>

        <Card
          title="Recovery Intelligence"
          subtitle="Operational status"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-blue-400"
                />

                <span className="text-xs text-white/60">
                  Cases monitored
                </span>
              </div>

              <span className="font-mono-tech text-white">
                {recoveries.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <Clock3
                  size={15}
                  className="text-amber-400"
                />

                <span className="text-xs text-white/60">
                  Pending recovery
                </span>
              </div>

              <span className="font-mono-tech text-amber-400">
                {stats.pendingCases}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <Target
                  size={15}
                  className="text-emerald-400"
                />

                <span className="text-xs text-white/60">
                  Recovery rate
                </span>
              </div>

              <span className="font-mono-tech text-emerald-400">
                {stats.recoveryRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <XCircle
                  size={15}
                  className="text-rose-400"
                />

                <span className="text-xs text-white/60">
                  Failed / cancelled
                </span>
              </div>

              <span className="font-mono-tech text-rose-400">
                {stats.failedCases}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Recovery Case Queue"
        subtitle="Live recovery cases generated by the risk workflow"
        className="mt-4"
        action={
          <span className="text-[10px] font-mono-tech text-blue-400">
            {recoveries.length} CASES
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
              LOADING RECOVERY CASES...
            </div>
          </div>
        ) : recoveries.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck
              size={28}
              className="mx-auto text-white/20"
            />

            <div className="mt-3 text-sm text-white/50">
              No recovery cases found
            </div>

            <div className="mt-1 text-[10px] font-mono-tech text-white/30">
              High-risk transactions will
              appear here automatically.
            </div>
          </div>
        ) : (
          <TableContainer>
            <thead>
              <tr>
                <Th>Transaction</Th>
                <Th>Original Amount</Th>
                <Th>Recovered</Th>
                <Th>Outstanding</Th>
                <Th>Progress</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>

            <tbody>
              {recoveries.map(
                (recovery, index) => {
                  const original =
                    Number(
                      recovery.original_amount ||
                        0
                    );

                  const recovered =
                    Number(
                      recovery.recovered_amount ||
                        0
                    );

                  const outstanding =
                    Math.max(
                      original - recovered,
                      0
                    );

                  const progress =
                    original > 0
                      ? (recovered /
                          original) *
                        100
                      : 0;

                  const selected =
                    selectedRecovery?._id ===
                    recovery._id;

                  return (
                    <motion.tr
                      key={
                        recovery._id ||
                        recovery.transaction_id
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
                        delay: index * 0.03,
                      }}
                      onClick={() =>
                        selectRecovery(
                          recovery
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
                          {
                            recovery.transaction_id
                          }
                        </span>
                      </Td>

                      <Td className="font-mono-tech text-white">
                        {formatINR(original)}
                      </Td>

                      <Td className="font-mono-tech text-emerald-400">
                        {formatINR(recovered)}
                      </Td>

                      <Td className="font-mono-tech text-rose-400">
                        {formatINR(
                          outstanding
                        )}
                      </Td>

                      <Td className="min-w-[130px]">
                        <div className="space-y-1">
                          <ProgressBar
                            value={progress}
                          />

                          <div className="text-[9px] font-mono-tech text-white/30">
                            {progress.toFixed(0)}%
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <span
                          className={`inline-flex items-center rounded border px-2 py-1 text-[10px] font-mono-tech ${getStatusClass(
                            recovery.status
                          )}`}
                        >
                          {getStatusLabel(
                            recovery.status
                          )}
                        </span>
                      </Td>

                      <Td className="text-[10px] font-mono-tech text-white/40">
                        {formatDate(
                          recovery.created_at
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

      {selectedRecovery && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            title="Recovery Case"
            subtitle="Selected financial exposure"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Transaction
                </div>

                <div className="mt-1 text-sm font-mono-tech text-blue-400">
                  {
                    selectedRecovery.transaction_id
                  }
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Original
                </div>

                <div className="mt-1 text-sm font-mono-tech text-white">
                  {formatINR(
                    selectedOriginalAmount
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Recovered
                </div>

                <div className="mt-1 text-sm font-mono-tech text-emerald-400">
                  {formatINR(
                    selectedRecoveredAmount
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Outstanding
                </div>

                <div className="mt-1 text-sm font-mono-tech text-rose-400">
                  {formatINR(
                    selectedOutstanding
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
                  Case Recovery Progress
                </span>

                <span className="text-[10px] font-mono-tech text-cyan-400">
                  {selectedRecoveryRate.toFixed(1)}%
                </span>
              </div>

              <ProgressBar
                value={selectedRecoveryRate}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Customer
                </div>

                <div className="mt-1 text-xs font-mono-tech text-white/70">
                  {selectedRecovery.customer_id ||
                    "—"}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Merchant
                </div>

                <div className="mt-1 text-xs font-mono-tech text-white/70">
                  {selectedRecovery.merchant_id ||
                    "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-white/[0.05] bg-white/[0.015] p-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight
                  size={13}
                  className="text-blue-400"
                />

                <span className="text-[10px] font-mono-tech uppercase text-white/40">
                  Recovery Strategy
                </span>
              </div>

              <div className="mt-2 text-xs text-white/60">
                {selectedRecovery.recommended_action ||
                  "No explicit recovery strategy has been returned by the backend."}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
              <div>
                <div className="text-[9px] font-mono-tech uppercase text-white/30">
                  Case Status
                </div>

                <div className="mt-1 text-xs font-mono-tech text-white/70">
                  {getStatusLabel(
                    selectedRecovery.status
                  )}
                </div>
              </div>

              {typeof selectedRecovery.recovery_probability ===
                "number" && (
                <div className="text-right">
                  <div className="text-[9px] font-mono-tech uppercase text-white/30">
                    Recovery Probability
                  </div>

                  <div className="mt-1 text-sm font-mono-tech text-cyan-400">
                    {selectedRecovery.recovery_probability.toFixed(
                      1
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Recovery Action"
            subtitle="Update recovered revenue"
          >
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] font-mono-tech uppercase tracking-wider text-white/40">
                  Recovered Amount
                </label>

                <span className="text-[9px] font-mono-tech text-white/30">
                  MAX{" "}
                  {formatINR(
                    selectedOriginalAmount
                  )}
                </span>
              </div>

              <div className="relative">
                <IndianRupee
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type="number"
                  min="0"
                  max={
                    selectedOriginalAmount
                  }
                  step="0.01"
                  value={recoveredAmount}
                  onChange={(event) =>
                    setRecoveredAmount(
                      event.target.value
                    )
                  }
                  disabled={
                    actionLoading ||
                    selectedRecovery.status?.toUpperCase() ===
                      "RECOVERED"
                  }
                  className="w-full rounded-md border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm font-mono-tech text-white outline-none focus:border-blue-400/40 disabled:opacity-50"
                  placeholder="Enter recovered amount"
                />
              </div>
            </div>

            {actionError && (
              <div className="mb-3 flex gap-2 rounded-md border border-rose-400/20 bg-rose-400/[0.05] p-2.5">
                <XCircle
                  size={14}
                  className="mt-0.5 text-rose-400"
                />

                <span className="text-[10px] font-mono-tech text-rose-300">
                  {actionError}
                </span>
              </div>
            )}

            {actionMessage && (
              <div className="mb-3 flex gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/[0.05] p-2.5">
                <CheckCircle2
                  size={14}
                  className="mt-0.5 text-emerald-400"
                />

                <span className="text-[10px] font-mono-tech text-emerald-300">
                  {actionMessage}
                </span>
              </div>
            )}

            <button
              onClick={
                handleCompleteRecovery
              }
              disabled={
                actionLoading ||
                selectedRecovery.status?.toUpperCase() ===
                  "RECOVERED"
              }
              className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-400/30 bg-blue-500/10 px-3 py-2.5 text-[11px] font-mono-tech text-blue-300 transition-colors hover:border-blue-400/50 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading ? (
                <>
                  <RefreshCw
                    size={13}
                    className="animate-spin"
                  />
                  PROCESSING...
                </>
              ) : selectedRecovery.status?.toUpperCase() ===
                "RECOVERED" ? (
                <>
                  <CheckCircle2 size={13} />
                  RECOVERY COMPLETED
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  UPDATE RECOVERY
                </>
              )}
            </button>

            <div className="mt-4 text-[9px] font-mono-tech leading-relaxed text-white/25">
              Recovery updates are persisted to
              MongoDB through the protected
              LedgerGuard API.
            </div>
          </Card>
        </div>
      )}

      <Card
        title="Recovery Opportunity Intelligence"
        subtitle="Outstanding exposure ranked by recoverable opportunity"
        className="mt-4"
      >
        {opportunityData.length === 0 ? (
          <div className="py-10 text-center text-[11px] font-mono-tech text-white/30">
            No outstanding recovery opportunities.
          </div>
        ) : (
          <div className="space-y-3">
            {opportunityData.map(
              (item, index) => (
                <motion.div
                  key={
                    item.id ||
                    item.transaction_id
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
                    delay: index * 0.04,
                  }}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-white/[0.04] bg-white/[0.02] p-3 md:grid-cols-[1.3fr_1fr_100px]"
                >
                  <div>
                    <div className="text-xs font-mono-tech text-blue-400">
                      {
                        item.transaction_id
                      }
                    </div>

                    <div className="mt-1 text-[9px] font-mono-tech text-white/30">
                      Recovery progress{" "}
                      {item.progress.toFixed(0)}%
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <ProgressBar
                      value={item.progress}
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono-tech text-white">
                      {formatINR(
                        item.exposure
                      )}
                    </div>

                    <div className="mt-1 text-[9px] font-mono-tech text-rose-400/70">
                      OUTSTANDING
                    </div>

                    {item.probability !==
                      null && (
                      <div className="mt-1 text-[9px] font-mono-tech text-cyan-400/70">
                        {item.probability.toFixed(
                          0
                        )}
                        % PROBABILITY
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
