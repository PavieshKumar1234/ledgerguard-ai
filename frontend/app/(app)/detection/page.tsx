"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { getAlerts } from "@/lib/api";

type AlertItem = {
  _id?: string;
  id?: string;
  alert_id?: string;
  transaction_id?: string;
  transactionId?: string;

  type?: string;
  alert_type?: string;
  alertType?: string;

  title?: string;
  message?: string;
  description?: string;

  severity?: string;
  status?: string;

  risk_score?: number;
  riskScore?: number;
  risk?: number;

  risk_level?: string;
  riskLevel?: string;

  decision?: string;

  customer_id?: string;
  customerId?: string;

  amount?: number;
  transaction_amount?: number;
  transactionAmount?: number;

  currency?: string;

  location?: string;

  device_id?: string;
  deviceId?: string;

  ip_address?: string;
  ipAddress?: string;

  rule_score?: number;
  ruleScore?: number;

  ml_score?: number;
  mlScore?: number;

  anomaly_score?: number;
  anomalyScore?: number;

  created_at?: string;
  createdAt?: string;

  triggered_rules?: string[];
  triggeredRules?: string[];

  [key: string]: unknown;
};

type SeverityFilter = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type StatusFilter = "ALL" | "OPEN" | "INVESTIGATING" | "RESOLVED";

function valueOf(
  item: AlertItem,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (
      item[key] !== undefined &&
      item[key] !== null &&
      item[key] !== ""
    ) {
      return item[key];
    }
  }

  return undefined;
}

function numberOf(
  item: AlertItem,
  ...keys: string[]
): number {
  const value = valueOf(item, ...keys);
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function stringOf(
  item: AlertItem,
  ...keys: string[]
): string {
  const value = valueOf(item, ...keys);

  return value === undefined || value === null
    ? ""
    : String(value);
}

function getAlertId(item: AlertItem): string {
  return (
    stringOf(
      item,
      "alert_id",
      "alertId",
      "id",
      "_id"
    ) || "ALERT"
  );
}

function getTransactionId(
  item: AlertItem
): string {
  return (
    stringOf(
      item,
      "transaction_id",
      "transactionId",
      "transaction"
    ) || "—"
  );
}

function getSeverity(
  item: AlertItem
): string {
  return stringOf(
    item,
    "severity",
    "risk_level",
    "riskLevel"
  ).toUpperCase() || "MEDIUM";
}

function getStatus(
  item: AlertItem
): string {
  return (
    stringOf(
      item,
      "status"
    ).toUpperCase() || "OPEN"
  );
}

function getRiskScore(
  item: AlertItem
): number {
  return numberOf(
    item,
    "risk_score",
    "riskScore",
    "risk"
  );
}

function getAmount(
  item: AlertItem
): number {
  return numberOf(
    item,
    "amount",
    "transaction_amount",
    "transactionAmount"
  );
}

function getCustomer(
  item: AlertItem
): string {
  return (
    stringOf(
      item,
      "customer_id",
      "customerId"
    ) || "Unknown customer"
  );
}

function getLocation(
  item: AlertItem
): string {
  return (
    stringOf(
      item,
      "location"
    ) || "Unknown location"
  );
}

function getDevice(
  item: AlertItem
): string {
  return (
    stringOf(
      item,
      "device_id",
      "deviceId"
    ) || "Unknown device"
  );
}

function getIp(
  item: AlertItem
): string {
  return (
    stringOf(
      item,
      "ip_address",
      "ipAddress"
    ) || "Unknown IP"
  );
}

function getTimestamp(
  item: AlertItem
): string {
  return stringOf(
    item,
    "created_at",
    "createdAt"
  );
}

function formatCurrency(
  amount: number,
  currency = "INR"
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency:
        currency || "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

function formatTime(
  value: string
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function severityClass(
  severity: string
): string {
  switch (severity) {
    case "CRITICAL":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "HIGH":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

    case "LOW":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

function severityDot(
  severity: string
): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-400";

    case "HIGH":
      return "bg-orange-400";

    case "MEDIUM":
      return "bg-yellow-400";

    case "LOW":
      return "bg-emerald-400";

    default:
      return "bg-white/40";
  }
}

function statusClass(
  status: string
): string {
  switch (status) {
    case "RESOLVED":
      return "text-emerald-400";

    case "INVESTIGATING":
      return "text-blue-400";

    case "OPEN":
      return "text-orange-400";

    default:
      return "text-white/50";
  }
}

export default function DetectionPage() {
  const [alerts, setAlerts] =
    useState<AlertItem[]>([]);

  const [selectedAlert, setSelectedAlert] =
    useState<AlertItem | null>(null);

  const [search, setSearch] =
    useState("");

  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadAlerts = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getAlerts(100);

        const data = Array.isArray(
          response
        )
          ? response
          : Array.isArray(
                response?.alerts
              )
            ? response.alerts
            : [];

        setAlerts(data);

        setSelectedAlert(
          (current) => {
            if (!current) return null;

            const currentId =
              getAlertId(current);

            return (
              data.find(
                (item: AlertItem) =>
                  getAlertId(item) ===
                  currentId
              ) || null
            );
          }
        );
      } catch (err) {
        console.error(
          "Failed to load alerts:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load detection alerts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAlerts();

    const interval =
      window.setInterval(() => {
        loadAlerts();
      }, 30000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [loadAlerts]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,

      critical: alerts.filter(
        (item) =>
          getSeverity(item) ===
          "CRITICAL"
      ).length,

      high: alerts.filter(
        (item) =>
          getSeverity(item) ===
          "HIGH"
      ).length,

      medium: alerts.filter(
        (item) =>
          getSeverity(item) ===
          "MEDIUM"
      ).length,

      low: alerts.filter(
        (item) =>
          getSeverity(item) ===
          "LOW"
      ).length,

      open: alerts.filter(
        (item) =>
          getStatus(item) ===
          "OPEN"
      ).length,

      investigating:
        alerts.filter(
          (item) =>
            getStatus(item) ===
            "INVESTIGATING"
        ).length,

      resolved: alerts.filter(
        (item) =>
          getStatus(item) ===
          "RESOLVED"
      ).length,
    };
  }, [alerts]);

  const filteredAlerts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return alerts
        .filter((item) => {
          if (
            severityFilter !==
              "ALL" &&
            getSeverity(item) !==
              severityFilter
          ) {
            return false;
          }

          if (
            statusFilter !==
              "ALL" &&
            getStatus(item) !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              getAlertId(item),
              getTransactionId(item),
              getCustomer(item),
              getLocation(item),
              getDevice(item),
              getIp(item),
              stringOf(
                item,
                "title",
                "alert_type",
                "alertType",
                "type"
              ),
              stringOf(
                item,
                "message",
                "description"
              ),
            ]
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        })
        .sort(
          (a, b) =>
            getRiskScore(b) -
            getRiskScore(a)
        );
    }, [
      alerts,
      search,
      severityFilter,
      statusFilter,
    ]);

  const selectedRisk =
    selectedAlert
      ? getRiskScore(
          selectedAlert
        )
      : 0;

  const selectedRules =
    selectedAlert
      ? valueOf(
          selectedAlert,
          "triggered_rules",
          "triggeredRules"
        )
      : [];

  const rules = Array.isArray(
    selectedRules
  )
    ? selectedRules
    : [];

  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      <div className="mx-auto max-w-[1800px] p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <ShieldAlert className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Detection Center
                </h1>

                <p className="mt-0.5 text-sm text-white/45">
                  Real-time fraud alert
                  operations
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <span className="text-xs font-medium text-emerald-400">
                LIVE MONITORING
              </span>
            </div>

            <button
              onClick={() =>
                loadAlerts(true)
              }
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Critical Alerts"
            value={stats.critical}
            icon={
              <ShieldAlert className="h-5 w-5" />
            }
            tone="critical"
          />

          <KpiCard
            label="High Severity"
            value={stats.high}
            icon={
              <AlertTriangle className="h-5 w-5" />
            }
            tone="high"
          />

          <KpiCard
            label="Medium Severity"
            value={stats.medium}
            icon={
              <Zap className="h-5 w-5" />
            }
            tone="medium"
          />

          <KpiCard
            label="Total Alerts"
            value={stats.total}
            icon={
              <Eye className="h-5 w-5" />
            }
            tone="default"
          />
        </div>

        {/* SECONDARY STATUS STRIP */}
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
          <StatusMetric
            label="Open"
            value={stats.open}
            icon={
              <Clock3 className="h-3.5 w-3.5" />
            }
            className="text-orange-400"
          />

          <StatusMetric
            label="Investigating"
            value={stats.investigating}
            icon={
              <BrainCircuit className="h-3.5 w-3.5" />
            }
            className="text-blue-400"
          />

          <StatusMetric
            label="Resolved"
            value={stats.resolved}
            icon={
              <CheckCircle2 className="h-3.5 w-3.5" />
            }
            className="text-emerald-400"
          />

          <div className="ml-auto hidden text-[11px] text-white/30 md:block">
            Automatic refresh every
            30 seconds
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />

            <span className="flex-1">
              {error}
            </span>

            <button
              onClick={() =>
                loadAlerts(true)
              }
              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* WORKSPACE */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* ALERT QUEUE */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
            {/* TOOLBAR */}
            <div className="flex flex-col gap-3 border-b border-white/8 p-4 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search alerts, transactions, customers, devices..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/30" />

                <select
                  value={
                    severityFilter
                  }
                  onChange={(event) =>
                    setSeverityFilter(
                      event.target
                        .value as SeverityFilter
                    )
                  }
                  className="rounded-xl border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-xs text-white/65 outline-none focus:border-blue-500/40"
                >
                  <option value="ALL">
                    All Severity
                  </option>
                  <option value="CRITICAL">
                    Critical
                  </option>
                  <option value="HIGH">
                    High
                  </option>
                  <option value="MEDIUM">
                    Medium
                  </option>
                  <option value="LOW">
                    Low
                  </option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter
                    )
                  }
                  className="rounded-xl border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-xs text-white/65 outline-none focus:border-blue-500/40"
                >
                  <option value="ALL">
                    All Status
                  </option>
                  <option value="OPEN">
                    Open
                  </option>
                  <option value="INVESTIGATING">
                    Investigating
                  </option>
                  <option value="RESOLVED">
                    Resolved
                  </option>
                </select>
              </div>
            </div>

            {/* QUEUE HEADER */}
            <div className="hidden grid-cols-[110px_125px_minmax(150px,1fr)_120px_105px_100px] gap-3 border-b border-white/6 px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-white/25 lg:grid">
              <span>Severity</span>
              <span>Alert</span>
              <span>Transaction</span>
              <span>Exposure</span>
              <span>Risk</span>
              <span>Status</span>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  Loading detection signals...
                </div>
              </div>
            )}

            {/* EMPTY */}
            {!loading &&
              filteredAlerts.length ===
                0 && (
                <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/5">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>

                  <h3 className="text-sm font-medium text-white/80">
                    No matching alerts
                  </h3>

                  <p className="mt-1 max-w-sm text-xs text-white/35">
                    The detection queue has no
                    alerts matching the current
                    search and filters.
                  </p>
                </div>
              )}

            {/* ALERT ROWS */}
            {!loading &&
              filteredAlerts.length >
                0 && (
                <div className="divide-y divide-white/6">
                  {filteredAlerts.map(
                    (item) => {
                      const id =
                        getAlertId(item);

                      const severity =
                        getSeverity(item);

                      const status =
                        getStatus(item);

                      const risk =
                        getRiskScore(item);

                      const amount =
                        getAmount(item);

                      const selected =
                        selectedAlert &&
                        getAlertId(
                          selectedAlert
                        ) === id;

                      return (
                        <button
                          key={id}
                          onClick={() =>
                            setSelectedAlert(
                              item
                            )
                          }
                          className={`group w-full text-left transition ${
                            selected
                              ? "bg-blue-500/[0.07]"
                              : "hover:bg-white/[0.025]"
                          }`}
                        >
                          <div className="px-4 py-4 lg:grid lg:grid-cols-[110px_125px_minmax(150px,1fr)_120px_105px_100px] lg:items-center lg:gap-3 lg:px-5">
                            {/* SEVERITY */}
                            <div className="mb-2 lg:mb-0">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${severityClass(
                                  severity
                                )}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${severityDot(
                                    severity
                                  )}`}
                                />

                                {severity}
                              </span>
                            </div>

                            {/* ALERT */}
                            <div className="mb-2 lg:mb-0">
                              <div className="font-mono text-xs text-white/75">
                                {id}
                              </div>

                              <div className="mt-1 text-[10px] text-white/30">
                                {formatTime(
                                  getTimestamp(
                                    item
                                  )
                                )}
                              </div>
                            </div>

                            {/* TRANSACTION */}
                            <div className="mb-3 min-w-0 lg:mb-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-mono text-xs text-blue-300/80">
                                  {getTransactionId(
                                    item
                                  )}
                                </span>

                                <ArrowUpRight className="h-3 w-3 shrink-0 text-white/20 transition group-hover:text-blue-400" />
                              </div>

                              <div className="mt-1 truncate text-[10px] text-white/30">
                                {getCustomer(
                                  item
                                )}
                              </div>
                            </div>

                            {/* AMOUNT */}
                            <div className="mb-3 lg:mb-0">
                              <div className="text-xs font-medium text-white/75">
                                {formatCurrency(
                                  amount,
                                  stringOf(
                                    item,
                                    "currency"
                                  ) ||
                                    "INR"
                                )}
                              </div>

                              <div className="mt-1 text-[10px] text-white/25">
                                exposure
                              </div>
                            </div>

                            {/* RISK */}
                            <div className="mb-3 lg:mb-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-semibold ${
                                    risk >=
                                    80
                                      ? "text-red-400"
                                      : risk >=
                                          50
                                        ? "text-orange-400"
                                        : risk >=
                                            30
                                          ? "text-yellow-400"
                                          : "text-emerald-400"
                                  }`}
                                >
                                  {risk.toFixed(
                                    0
                                  )}
                                </span>

                                <span className="text-[10px] text-white/25">
                                  / 100
                                </span>
                              </div>

                              <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-white/8">
                                <div
                                  className="h-full rounded-full bg-current"
                                  style={{
                                    width: `${Math.min(
                                      risk,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* STATUS */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold ${statusClass(
                                  status
                                )}`}
                              >
                                {status}
                              </span>

                              <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-white/15 transition group-hover:text-white/50" />
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
          </section>

          {/* DETAILS */}
          <aside className="min-w-0">
            {selectedAlert ? (
              <div className="sticky top-6 overflow-hidden rounded-2xl border border-white/8 bg-[#0a0d12]">
                {/* DETAILS HEADER */}
                <div className="border-b border-white/8 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${severityDot(
                            getSeverity(
                              selectedAlert
                            )
                          )}`}
                        />

                        <span
                          className={`text-[10px] font-semibold tracking-widest ${severityClass(
                            getSeverity(
                              selectedAlert
                            )
                          )
                            .replace(
                              /border-[^ ]+/,
                              ""
                            )
                            .replace(
                              /bg-[^ ]+/,
                              ""
                            )
                            .trim()}`}
                        >
                          {getSeverity(
                            selectedAlert
                          )}{" "}
                          ALERT
                        </span>
                      </div>

                      <h2 className="font-mono text-sm text-white/90">
                        {getAlertId(
                          selectedAlert
                        )}
                      </h2>

                      <p className="mt-1 text-[11px] text-white/35">
                        {formatTime(
                          getTimestamp(
                            selectedAlert
                          )
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedAlert(
                          null
                        )
                      }
                      className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* RISK SCORE */}
                <div className="border-b border-white/8 p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-white/30">
                      Risk Score
                    </span>

                    <span className="text-xl font-semibold text-red-400">
                      {selectedRisk.toFixed(
                        2
                      )}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{
                        width: `${Math.min(
                          selectedRisk,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-white/30">
                    <span>
                      Decision
                    </span>

                    <span className="font-semibold text-white/70">
                      {stringOf(
                        selectedAlert,
                        "decision"
                      ) || "REVIEW"}
                    </span>
                  </div>
                </div>

                {/* TRANSACTION */}
                <div className="border-b border-white/8 p-5">
                  <SectionTitle>
                    Transaction
                  </SectionTitle>

                  <DetailRow
                    label="Transaction ID"
                    value={getTransactionId(
                      selectedAlert
                    )}
                    mono
                  />

                  <DetailRow
                    label="Customer"
                    value={getCustomer(
                      selectedAlert
                    )}
                    mono
                  />

                  <DetailRow
                    label="Amount"
                    value={formatCurrency(
                      getAmount(
                        selectedAlert
                      ),
                      stringOf(
                        selectedAlert,
                        "currency"
                      ) || "INR"
                    )}
                  />

                  <DetailRow
                    label="Location"
                    value={getLocation(
                      selectedAlert
                    )}
                  />
                </div>

                {/* DEVICE */}
                <div className="border-b border-white/8 p-5">
                  <SectionTitle>
                    Device Intelligence
                  </SectionTitle>

                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                      <Smartphone className="h-4 w-4 text-blue-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-white/25">
                        Device
                      </div>

                      <div className="truncate font-mono text-xs text-white/70">
                        {getDevice(
                          selectedAlert
                        )}
                      </div>
                    </div>
                  </div>

                  <DetailRow
                    label="IP Address"
                    value={getIp(
                      selectedAlert
                    )}
                    mono
                  />
                </div>

                {/* MODEL SIGNALS */}
                <div className="border-b border-white/8 p-5">
                  <SectionTitle>
                    Detection Signals
                  </SectionTitle>

                  <SignalRow
                    label="ML Score"
                    value={numberOf(
                      selectedAlert,
                      "ml_score",
                      "mlScore"
                    )}
                  />

                  <SignalRow
                    label="Rule Score"
                    value={numberOf(
                      selectedAlert,
                      "rule_score",
                      "ruleScore"
                    )}
                  />

                  <SignalRow
                    label="Anomaly Score"
                    value={numberOf(
                      selectedAlert,
                      "anomaly_score",
                      "anomalyScore"
                    )}
                  />
                </div>

                {/* RULES */}
                <div className="p-5">
                  <SectionTitle>
                    Triggered Rules
                  </SectionTitle>

                  {rules.length >
                  0 ? (
                    <div className="space-y-2">
                      {rules.map(
                        (
                          rule,
                          index
                        ) => (
                          <div
                            key={`${rule}-${index}`}
                            className="flex items-start gap-2 rounded-lg border border-red-500/10 bg-red-500/[0.04] p-2.5"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />

                            <span className="text-[11px] leading-4 text-white/60">
                              {rule}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[11px] text-white/30">
                      No individual rule
                      breakdown was
                      provided by the
                      alert record.
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.03] p-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-blue-400" />

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                        Detection Engine
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-white/40">
                      Alert generated from
                      LedgerGuard's live risk
                      evaluation pipeline using
                      machine-learning,
                      rule-based and anomaly
                      signals.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sticky top-6 flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] px-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/5">
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>

                <h3 className="text-sm font-medium text-white/75">
                  Select an alert
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-5 text-white/30">
                  Select a detection signal from
                  the queue to inspect its risk,
                  transaction and intelligence
                  details.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone:
    | "critical"
    | "high"
    | "medium"
    | "default";
}) {
  const styles = {
    critical:
      "border-red-500/15 bg-red-500/[0.035] text-red-400",
    high:
      "border-orange-500/15 bg-orange-500/[0.035] text-orange-400",
    medium:
      "border-yellow-500/15 bg-yellow-500/[0.035] text-yellow-400",
    default:
      "border-white/8 bg-white/[0.025] text-blue-400",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${styles[tone]}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/10 bg-current/5">
          {icon}
        </div>

        <span className="text-2xl font-semibold tracking-tight text-white">
          {value}
        </span>
      </div>

      <div className="mt-4 text-[10px] font-medium uppercase tracking-wider text-white/35">
        {label}
      </div>
    </div>
  );
}

function StatusMetric({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={className}>
        {icon}
      </span>

      <span className="text-xs text-white/35">
        {label}
      </span>

      <span
        className={`text-xs font-semibold ${className}`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4 last:mb-0">
      <span className="text-[11px] text-white/30">
        {label}
      </span>

      <span
        className={`max-w-[220px] break-all text-right text-[11px] text-white/65 ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SignalRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] text-white/35">
          {label}
        </span>

        <span className="font-mono text-[11px] text-white/65">
          {value.toFixed(2)}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-white/7">
        <div
          className="h-full rounded-full bg-blue-400/70"
          style={{
            width: `${Math.min(
              Math.max(value, 0),
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}