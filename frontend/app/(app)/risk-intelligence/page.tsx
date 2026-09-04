"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  ShieldAlert,
  Zap,
  AlertTriangle,
  ArrowRight,
  Brain,
  Activity,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import {
  PageHeader,
  Card,
  StatCard,
  PageContainer,
} from "@/components/shared/page-primitives";

import {
  riskDistribution,
  riskTrendData,
  riskFactorData,
  fraudSpikeData,
  formatINR,
} from "@/lib/demo-data";

import {
  getTransactions,
  predictRisk,
} from "@/lib/api";


/* ============================================================
   TYPES
============================================================ */

type Transaction = {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  merchant_id: string;
  device_id: string;
  ip_address: string;
  location: string;
  status: string;
};


type RiskResult = {
  transaction_id: string;

  // Normalized risk object used by the UI.
  risk: {
    risk_score: number;
    decision: string;
    fraud_probability: number;
    ml_risk_score: number;
    rule_score: number;
    anomaly_score: number;
    threshold: number;
    triggered_rules: string[];
  };

  // Optional direct fields support an unwrapped backend risk payload.
  risk_score?: number;
  score?: number;
  decision?: string;
  fraud_probability?: number;
  ml_probability?: number;
  ml_risk_score?: number;
  ml_score?: number;
  rule_score?: number;
  anomaly_score?: number;
  threshold?: number;
  triggered_rules?: string[];

  workflow: {
    investigation_created: boolean;
    alert_created: boolean;
    recovery_created: boolean;
  };

  investigation: {
    _id: string;
    transaction_id: string;
    customer_id: string;
    merchant_id: string;
    risk_score: number;
    decision: string;
    severity: string;
    status: string;
    recommended_action: string;
  } | null;

  alert: {
    alert_created?: boolean;
    message?: string;
    alert?: {
      _id: string;
      status: string;
    };
  } | null;

  recovery: {
    _id?: string;
    transaction_id?: string;
    status?: string;
    original_amount?: number;
  } | null;
};


/* ============================================================
   TOOLTIP
============================================================ */

const tooltipStyle = {
  backgroundColor: "#0d1117",
  border: "1px solid #1a2029",
  borderRadius: "6px",
  fontSize: "12px",
};


/* ============================================================
   MAIN PAGE
============================================================ */

export default function RiskIntelligencePage() {
  const [transactions, setTransactions] = useState<
    Transaction[]
  >([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState("");

  const [riskResult, setRiskResult] =
    useState<RiskResult | null>(null);

  const [loadingTransactions, setLoadingTransactions] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState("");


  /* ==========================================================
     LOAD REAL TRANSACTIONS
  ========================================================== */

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoadingTransactions(true);
        setError("");

        const data = await getTransactions(50);

        setTransactions(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load transactions from backend."
        );
      } finally {
        setLoadingTransactions(false);
      }
    }

    loadTransactions();
  }, []);


  /* ==========================================================
     RUN AI RISK ANALYSIS
  ========================================================== */

  async function analyzeRisk() {
    if (!selectedTransaction) {
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setRiskResult(null);

      const result =
        await predictRisk(
          selectedTransaction
        );

      // Normalize both supported backend response shapes:
      // { risk: { ... }, workflow: { ... } }
      // and { risk_score: ..., decision: ..., workflow: { ... } }.
      const normalizedResult = {
        ...result,
        risk:
          result?.risk ??
          {
            risk_score:
              result?.risk_score ??
              result?.score ??
              0,
            decision:
              result?.decision ??
              "ALLOW",
            fraud_probability:
              result?.fraud_probability ??
              result?.ml_probability ??
              0,
            ml_risk_score:
              result?.ml_risk_score ??
              result?.ml_score ??
              0,
            rule_score:
              result?.rule_score ??
              0,
            anomaly_score:
              result?.anomaly_score ??
              0,
            threshold:
              result?.threshold ??
              0,
            triggered_rules:
              Array.isArray(
                result?.triggered_rules
              )
                ? result.triggered_rules
                : [],
          },
      };

      setRiskResult(
        normalizedResult as RiskResult
      );

    } catch (err) {
      console.error(err);

      setError(
        "Risk analysis failed. Check the backend connection."
      );

    } finally {
      setAnalyzing(false);
    }
  }


  /* ==========================================================
     HELPERS
  ========================================================== */

  function getDecisionClass(
    decision?: string
  ) {
    switch (decision) {
      case "BLOCK":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";

      case "REVIEW":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";

      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  }


  function getRiskClass(
    score: number
  ) {
    if (score >= 80) {
      return "text-rose-400";
    }

    if (score >= 50) {
      return "text-amber-400";
    }

    return "text-emerald-400";
  }


  return (
    <PageContainer>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <PageHeader
        title="Risk Intelligence"
        subtitle="Advanced risk analytics and anomaly detection"
        icon={ShieldAlert}
      />


      {/* ======================================================
          AI ANALYSIS CONSOLE
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="mb-4"
      >
        <Card
          title="AI Risk Analysis"
          subtitle="Run the production risk pipeline against a transaction"
          action={
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

              ENGINE ONLINE
            </div>
          }
        >

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">

            {/* Transaction selector */}

            <div>

              <label className="block text-[10px] text-lg-muted uppercase font-mono-tech mb-2">
                Select transaction
              </label>

              <select
                value={selectedTransaction}
                onChange={(e) => {
                  setSelectedTransaction(
                    e.target.value
                  );

                  setRiskResult(null);
                  setError("");
                }}
                disabled={loadingTransactions}
                className="w-full bg-black/30 border border-lg rounded-md px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              >

                <option value="">
                  {loadingTransactions
                    ? "Loading transactions..."
                    : "Select a transaction"}
                </option>

                {transactions.map(
                  (transaction) => (
                    <option
                      key={
                        transaction.transaction_id
                      }
                      value={
                        transaction.transaction_id
                      }
                    >
                      {transaction.transaction_id} —{" "}
                      {transaction.currency}{" "}
                      {transaction.amount.toLocaleString()}
                    </option>
                  )
                )}

              </select>

              {selectedTransaction && (
                <div className="mt-2 text-[10px] text-lg-dim font-mono-tech">
                  TRANSACTION SELECTED ·{" "}
                  {selectedTransaction}
                </div>
              )}

            </div>


            {/* Analyze button */}

            <div className="flex items-end">

              <button
                onClick={analyzeRisk}
                disabled={
                  !selectedTransaction ||
                  analyzing
                }
                className="w-full lg:w-auto min-w-[180px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono-tech hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
              >

                {analyzing ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />

                    ANALYZING...
                  </>
                ) : (
                  <>
                    <Brain size={14} />

                    ANALYZE RISK
                  </>
                )}

              </button>

            </div>

          </div>


          {/* Error */}

          {error && (
            <div className="mt-3 p-2.5 rounded-md border border-rose-500/20 bg-rose-500/10 text-[11px] text-rose-400">
              {error}
            </div>
          )}

        </Card>
      </motion.div>


      {/* ======================================================
          LIVE RISK RESULT
      ====================================================== */}

      {riskResult && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-4"
        >

          <Card
            title="Live Risk Assessment"
            subtitle={`AI analysis for ${riskResult.transaction_id}`}
          >

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {/* Risk Score */}

              <div className="bg-white/[0.02] border border-lg rounded-md p-4">

                <div className="text-[10px] text-lg-muted font-mono-tech uppercase">
                  Risk Score
                </div>

                <div
                  className={`text-3xl font-bold font-mono-tech mt-1 ${getRiskClass(
                    riskResult.risk?.risk_score ?? 0
                  )}`}
                >
                  {riskResult.risk?.risk_score ?? 0}
                </div>

                <div className="text-[9px] text-lg-dim mt-1">
                  OUT OF 100
                </div>

              </div>


              {/* Decision */}

              <div className="bg-white/[0.02] border border-lg rounded-md p-4">

                <div className="text-[10px] text-lg-muted font-mono-tech uppercase">
                  Decision
                </div>

                <div
                  className={`inline-flex mt-2 px-3 py-1.5 rounded border text-sm font-bold font-mono-tech ${getDecisionClass(
                    riskResult.risk?.decision ?? "ALLOW"
                  )}`}
                >
                  {riskResult.risk?.decision ?? "ALLOW"}
                </div>

              </div>


              {/* ML */}

              <div className="bg-white/[0.02] border border-lg rounded-md p-4">

                <div className="text-[10px] text-lg-muted font-mono-tech uppercase">
                  ML Signal
                </div>

                <div className="text-2xl font-bold text-blue-400 font-mono-tech mt-1">
                  {riskResult.risk?.ml_risk_score ?? 0}
                </div>

                <div className="text-[9px] text-lg-dim mt-1">
                  XGBOOST
                </div>

              </div>


              {/* Anomaly */}

              <div className="bg-white/[0.02] border border-lg rounded-md p-4">

                <div className="text-[10px] text-lg-muted font-mono-tech uppercase">
                  Anomaly
                </div>

                <div className="text-2xl font-bold text-cyan-400 font-mono-tech mt-1">
                  {riskResult.risk?.anomaly_score ?? 0}
                </div>

                <div className="text-[9px] text-lg-dim mt-1">
                  BEHAVIORAL SIGNAL
                </div>

              </div>

            </div>


            {/* Signals */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">

              {/* Rule */}

              <div className="bg-white/[0.02] border border-lg rounded-md p-3">

                <div className="text-[10px] text-lg-muted font-mono-tech uppercase mb-2">
                  Rule Signal
                </div>

                <div className="flex items-center gap-2">

                  <ShieldCheck
                    size={15}
                    className="text-amber-400"
                  />

                  <span className="text-xl font-bold text-white font-mono-tech">
                    {riskResult.risk?.rule_score ?? 0}
                  </span>

                </div>

              </div>


              {/* Fraud Probability */}

              <div className="bg-white/[0.02] border border-lg rounded-md p-3">

                <div className="text-[10px] text-lg-muted font-mono-tech uppercase mb-2">
                  Fraud Probability
                </div>

                <div className="flex items-center gap-2">

                  <Activity
                    size={15}
                    className="text-blue-400"
                  />

                  <span className="text-xl font-bold text-white font-mono-tech">
                    {(
                      riskResult.risk?.fraud_probability ?? 0 *
                      100
                    ).toFixed(1)}
                    %
                  </span>

                </div>

              </div>

            </div>


            {/* Triggered Rules */}

            <div className="mt-3">

              <div className="text-[10px] text-lg-muted font-mono-tech uppercase mb-2">
                Triggered Rules
              </div>

              {riskResult.risk?.triggered_rules ?? [].length === 0 ? (

                <div className="text-[11px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-md p-3">
                  No deterministic risk rules triggered.
                </div>

              ) : (

                <div className="flex flex-wrap gap-2">

                  {riskResult.risk?.triggered_rules ?? [].map(
                    (rule) => (
                      <span
                        key={rule}
                        className="px-2.5 py-1.5 rounded border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-400 font-mono-tech"
                      >
                        {rule}
                      </span>
                    )
                  )}

                </div>

              )}

            </div>

          </Card>

        </motion.div>
      )}


      {/* ======================================================
          AUTOMATED RESPONSE WORKFLOW
      ====================================================== */}

      {riskResult?.workflow && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-4"
        >

          <Card
            title="Automated Response Workflow"
            subtitle="Detection → investigation → response orchestration"
            action={
              <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-emerald-400">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                PIPELINE COMPLETE

              </div>
            }
          >

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <WorkflowStep
                number="01"
                label="Investigation"
                active={
                  riskResult.workflow
                    .investigation_created
                }
                description={
                  riskResult.workflow
                    .investigation_created
                    ? "Case automatically opened"
                    : "No investigation required"
                }
              />

              <WorkflowStep
                number="02"
                label="Alert"
                active={
                  riskResult.workflow
                    .alert_created
                }
                description={
                  riskResult.workflow
                    .alert_created
                    ? "Risk alert generated"
                    : "Alert threshold not reached"
                }
              />

              <WorkflowStep
                number="03"
                label="Recovery"
                active={
                  riskResult.workflow
                    .recovery_created
                }
                description={
                  riskResult.workflow
                    .recovery_created
                    ? "Recovery action created"
                    : "Recovery action not required"
                }
              />

            </div>


            {/* Pipeline connection */}

            <div className="hidden md:flex items-center gap-2 mt-4">

              <div className="h-px flex-1 bg-gradient-to-r from-blue-500/40 to-transparent" />

              <span className="text-[9px] font-mono-tech text-lg-dim uppercase">
                Automated Decision Pipeline
              </span>

              <div className="h-px flex-1 bg-gradient-to-l from-blue-500/40 to-transparent" />

            </div>

          </Card>

        </motion.div>
      )}


      {/* ======================================================
          WORKFLOW DETAILS
      ====================================================== */}

      {riskResult?.workflow && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-4"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Investigation */}

            {riskResult.investigation && (
              <Card
                title="Investigation Case"
                subtitle="Automated case generation"
              >

                <div className="space-y-3">

                  <WorkflowDetail
                    label="Case ID"
                    value={
                      riskResult.investigation._id
                    }
                  />

                  <WorkflowDetail
                    label="Severity"
                    value={
                      riskResult.investigation.severity
                    }
                  />

                  <WorkflowDetail
                    label="Status"
                    value={
                      riskResult.investigation.status
                    }
                  />

                  <WorkflowDetail
                    label="Recommended Action"
                    value={
                      riskResult.investigation
                        .recommended_action
                    }
                  />

                </div>

              </Card>
            )}


            {/* Alert */}

            {riskResult.alert && (
              <Card
                title="Risk Alert"
                subtitle="Automated alert generation"
              >

                <div className="space-y-3">

                  <div className="flex items-center gap-2">

                    <AlertTriangle
                      size={16}
                      className="text-amber-400"
                    />

                    <span className="text-sm text-white font-semibold">
                      Alert Status
                    </span>

                  </div>

                  <WorkflowDetail
                    label="Created"
                    value={
                      riskResult.alert.alert_created
                        ? "YES"
                        : "NO"
                    }
                  />

                  {riskResult.alert.alert && (
                    <WorkflowDetail
                      label="Status"
                      value={
                        riskResult.alert.alert.status
                      }
                    />
                  )}

                  {riskResult.alert.message && (
                    <p className="text-[10px] text-lg-muted leading-relaxed">
                      {riskResult.alert.message}
                    </p>
                  )}

                </div>

              </Card>
            )}


            {/* Recovery */}

            {riskResult.recovery && (
              <Card
                title="Recovery Action"
                subtitle="Automated revenue recovery"
              >

                <div className="space-y-3">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      size={16}
                      className="text-emerald-400"
                    />

                    <span className="text-sm text-white font-semibold">
                      Recovery Initiated
                    </span>

                  </div>

                  {riskResult.recovery.status && (
                    <WorkflowDetail
                      label="Status"
                      value={
                        riskResult.recovery.status
                      }
                    />
                  )}

                  {riskResult.recovery.original_amount !==
                    undefined && (
                    <WorkflowDetail
                      label="Original Amount"
                      value={formatINR(
                        riskResult.recovery
                          .original_amount
                      )}
                    />
                  )}

                </div>

              </Card>
            )}

          </div>

        </motion.div>
      )}


      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

        {[
          {
            label: "Critical",
            value: 142,
            change: 18,
            trend: "up" as const,
            color: "#f43f5e",
          },
          {
            label: "High",
            value: 387,
            change: 12,
            trend: "up" as const,
            color: "#f59e0b",
          },
          {
            label: "Medium",
            value: 892,
            change: -4,
            trend: "down" as const,
            color: "#2b8eff",
          },
          {
            label: "Low",
            value: 2104,
            change: 8,
            trend: "up" as const,
            color: "#22c55e",
          },
          {
            label: "Total Exposure",
            value: 15400000,
            change: 3.1,
            trend: "up" as const,
            color: "#a855f7",
          },
          {
            label: "Anomaly Count",
            value: 38,
            change: 22,
            trend: "up" as const,
            color: "#00d4ff",
          },
        ].map((s) => (
          <StatCard
            key={s.label}
            {...s}
          />
        ))}

      </div>


      {/* ======================================================
          CHARTS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk Distribution */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >

          <Card
            title="Risk Distribution"
            subtitle="Current transaction risk levels"
          >

            <ResponsiveContainer
              width="100%"
              height={200}
            >

              <PieChart>

                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >

                  {riskDistribution.map(
                    (entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                      />
                    )
                  )}

                </Pie>

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                />

              </PieChart>

            </ResponsiveContainer>


            <div className="grid grid-cols-2 gap-1.5 mt-2">

              {riskDistribution.map(
                (r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-1.5 text-[11px]"
                  >

                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{
                        backgroundColor:
                          r.color,
                      }}
                    />

                    <span className="text-lg-muted">
                      {r.name}
                    </span>

                    <span className="text-white font-mono-tech ml-auto">
                      {r.value}
                    </span>

                  </div>
                )
              )}

            </div>

          </Card>

        </motion.div>


        {/* Risk Trend */}

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
            delay: 0.05,
          }}
          className="lg:col-span-2"
        >

          <Card
            title="Risk Trend"
            subtitle="Daily risk level distribution (7 days)"
          >

            <ResponsiveContainer
              width="100%"
              height={260}
            >

              <BarChart
                data={riskTrendData}
              >

                <XAxis
                  dataKey="day"
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
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "10px",
                    fontFamily:
                      "var(--font-mono-tech)",
                  }}
                  iconType="square"
                />

                <Bar
                  dataKey="critical"
                  stackId="a"
                  fill="#f43f5e"
                />

                <Bar
                  dataKey="high"
                  stackId="a"
                  fill="#f59e0b"
                />

                <Bar
                  dataKey="medium"
                  stackId="a"
                  fill="#2b8eff"
                />

                <Bar
                  dataKey="low"
                  stackId="a"
                  fill="#22c55e"
                />

              </BarChart>

            </ResponsiveContainer>

          </Card>

        </motion.div>

      </div>


      {/* ======================================================
          FACTOR + SPIKE
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk Factor */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="lg:col-span-2"
        >

          <Card
            title="Risk Factor Analysis"
            subtitle="Contributing risk signals by factor"
          >

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <BarChart
                data={riskFactorData}
                layout="vertical"
                margin={{
                  left: 20,
                  right: 20,
                }}
              >

                <XAxis
                  type="number"
                  stroke="#4a5360"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />

                <YAxis
                  type="category"
                  dataKey="factor"
                  stroke="#4a5360"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                />

                <Bar
                  dataKey="score"
                  radius={[
                    0,
                    3,
                    3,
                    0,
                  ]}
                >

                  {riskFactorData.map(
                    (entry, i) => {

                      const color =
                        entry.score >= 80
                          ? "#f43f5e"
                          : entry.score >= 60
                          ? "#f59e0b"
                          : entry.score >= 40
                          ? "#2b8eff"
                          : "#22c55e";

                      return (
                        <Cell
                          key={i}
                          fill={color}
                        />
                      );
                    }
                  )}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </Card>

        </motion.div>


        {/* Fraud Spike */}

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
            delay: 0.05,
          }}
        >

          <Card
            title="Fraud Spike Detection"
            subtitle="Real-time anomaly alert"
            action={
              <span className="text-[10px] font-mono-tech text-rose-400 flex items-center gap-1">

                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-lg-pulse-soft" />

                ACTIVE

              </span>
            }
          >

            <div className="space-y-3">

              <div className="flex items-center gap-2 mb-1">

                <AlertTriangle
                  size={14}
                  className="text-rose-400"
                />

                <span className="text-[12px] text-white font-semibold">
                  Velocity Spike Detected
                </span>

              </div>


              <div className="grid grid-cols-2 gap-2">

                <div className="bg-white/[0.02] rounded-md p-2.5">

                  <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                    Current Spike
                  </div>

                  <div className="text-lg font-bold text-rose-400 font-mono-tech">
                    {fraudSpikeData.current}%
                  </div>

                </div>


                <div className="bg-white/[0.02] rounded-md p-2.5">

                  <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                    Baseline
                  </div>

                  <div className="text-lg font-bold text-white font-mono-tech">
                    {fraudSpikeData.baseline}%
                  </div>

                </div>


                <div className="bg-white/[0.02] rounded-md p-2.5">

                  <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                    Deviation
                  </div>

                  <div className="text-lg font-bold text-amber-400 font-mono-tech">
                    +{fraudSpikeData.deviation}%
                  </div>

                </div>


                <div className="bg-white/[0.02] rounded-md p-2.5">

                  <div className="text-[10px] font-mono-tech text-lg-muted uppercase">
                    Affected Txns
                  </div>

                  <div className="text-lg font-bold text-white font-mono-tech">
                    {fraudSpikeData.affectedTransactions}
                  </div>

                </div>

              </div>


              <div className="bg-white/[0.02] rounded-md p-2.5">

                <div className="text-[10px] font-mono-tech text-lg-muted uppercase mb-0.5">
                  Exposure
                </div>

                <div className="text-lg font-bold text-amber-400 font-mono-tech">
                  {formatINR(
                    fraudSpikeData.exposure
                  )}
                </div>

              </div>


              <p className="text-[11px] text-white/70 leading-relaxed">
                {fraudSpikeData.explanation}
              </p>


              <button
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono-tech text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/15 transition-colors"
              >

                <Zap size={12} />

                Investigate Spike

                <ArrowRight size={12} />

              </button>

            </div>

          </Card>

        </motion.div>

      </div>

    </PageContainer>
  );
}


/* ============================================================
   WORKFLOW STEP
============================================================ */

function WorkflowStep({
  number,
  label,
  active,
  description,
}: {
  number: string;
  label: string;
  active: boolean;
  description: string;
}) {
  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        active
          ? "border-blue-500/30 bg-blue-500/[0.05]"
          : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-2">

          <span
            className={`text-[10px] font-mono-tech ${
              active
                ? "text-blue-400"
                : "text-lg-dim"
            }`}
          >
            {number}
          </span>

          <span className="text-sm font-semibold text-white">
            {label}
          </span>

        </div>


        <span
          className={`w-2 h-2 rounded-full ${
            active
              ? "bg-emerald-400 animate-pulse"
              : "bg-zinc-700"
          }`}
        />

      </div>


      <div
        className={`mt-3 text-[10px] font-mono-tech uppercase ${
          active
            ? "text-emerald-400"
            : "text-lg-dim"
        }`}
      >
        {active
          ? "CREATED"
          : "NOT REQUIRED"}
      </div>


      <p className="mt-1 text-[11px] text-lg-muted">
        {description}
      </p>

    </div>
  );
}


/* ============================================================
   WORKFLOW DETAIL
============================================================ */

function WorkflowDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2">

      <span className="text-[9px] font-mono-tech text-lg-dim uppercase">
        {label}
      </span>

      <span className="text-[10px] text-white font-mono-tech text-right break-all">
        {value}
      </span>

    </div>
  );
}