"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  Card,
  PageContainer,
  PageHeader,
} from "@/components/shared/page-primitives";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAnalyticsOverview } from "@/lib/api";

type ModelComparison = {
  model: string;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  accuracy: number;
  false_positive_rate: number;
  false_negative_rate: number;
  inference_ms: number;
  training_seconds?: number;
  selected: boolean;
};

type AnalyticsData = {
  model: {
    name: string;
    algorithm: string;
    production_model: string;
    status: string;
  };

  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };

  threshold: {
    value: number;
    validation_cost: number;
    false_positive_cost: number;
    false_negative_cost: number;
  };

  model_comparison: ModelComparison[];

  confusion_matrix: {
    true_positive: number;
    false_negative: number;
    false_positive: number;
    true_negative: number;
  };

  roc: {
    auc: number;
    points: {
      fpr: number;
      tpr: number;
      threshold: number | null;
    }[];
  };

  precision_recall: {
    points: {
      recall: number;
      precision: number;
      threshold: number | null;
    }[];
  };

  threshold_optimization: {
    threshold: number;
    precision: number;
    recall: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
    true_negative: number;
  }[];

  evaluation: {
    total_dataset: number;
    training_set: number;
    validation_set: number;
    held_out_test_set: number;
    test_sample_count: number;
    fraud_samples: number;
    legitimate_samples: number;
  };

  false_positive_economics: {
    false_positives: number;
    lost_legitimate_revenue: number;
    customer_friction_cost: number;
    manual_review_cost: number;
    expected_recovery: number;
    net_financial_impact: number;
    assumptions: {
      legitimate_value_per_fp: number;
      customer_friction_per_fp: number;
      manual_review_per_case: number;
      recovery_rate: number;
    };
  };
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatINR(value: number) {
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }

  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "blue",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const iconClass =
    tone === "green"
      ? "text-emerald-400"
      : tone === "amber"
        ? "text-amber-400"
        : tone === "red"
          ? "text-red-400"
          : "text-blue-400";

  const borderClass =
    tone === "green"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/5"
        : tone === "red"
          ? "border-red-500/20 bg-red-500/5"
          : "border-blue-500/20 bg-blue-500/5";

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-lg-muted">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-lg-muted">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-lg border p-2 ${borderClass}`}
        >
          <Icon
            size={17}
            className={iconClass}
          />
        </div>
      </div>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/95 px-3 py-2 shadow-xl">
      <p className="mb-1 text-[10px] text-lg-muted">
        {label}
      </p>

      {payload.map((item, index) => (
        <p
          key={`${item.name}-${index}`}
          className="font-mono text-[11px] text-white"
        >
          {item.name}:{" "}
          {typeof item.value === "number"
            ? item.value.toFixed(3)
            : item.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAnalyticsOverview();

        setData(result);
      } catch (err) {
        console.error(
          "Analytics loading failed:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load model intelligence"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Model Intelligence"
          subtitle="ML model evaluation, performance metrics and threshold optimization"
          icon={BrainCircuit}
        />

        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <div className="animate-pulse">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="mt-4 h-7 w-20 rounded bg-white/10" />
                <div className="mt-2 h-2 w-28 rounded bg-white/5" />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <Card key={item}>
              <div className="h-64 animate-pulse rounded bg-white/5" />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <PageHeader
          title="Model Intelligence"
          subtitle="ML model evaluation, performance metrics and threshold optimization"
          icon={BrainCircuit}
        />

        <Card>
          <div className="flex items-center gap-3">
            <XCircle
              size={20}
              className="text-red-400"
            />

            <div>
              <p className="text-sm text-white">
                Model intelligence unavailable
              </p>

              <p className="mt-1 text-[11px] text-lg-muted">
                {error ||
                  "The analytics service did not return model data."}
              </p>
            </div>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const {
    model,
    metrics,
    threshold,
    model_comparison,
    confusion_matrix,
    roc,
    precision_recall,
    threshold_optimization,
    evaluation,
    false_positive_economics,
  } = data;

  const flaggedCases =
    metrics.true_positive +
    metrics.false_positive;

  const totalPredictions =
    evaluation.test_sample_count ||
    metrics.true_negative +
      metrics.false_positive +
      metrics.false_negative +
      metrics.true_positive;

  const falsePositiveRate =
    metrics.false_positive +
      metrics.true_negative >
    0
      ? metrics.false_positive /
        (metrics.false_positive +
          metrics.true_negative)
      : 0;

  return (
    <PageContainer>
      {/* HEADER */}
      <PageHeader
        title="Model Intelligence"
        subtitle="ML model evaluation, performance metrics and threshold optimization"
        icon={BrainCircuit}
      />

      {/* SYSTEM STATUS */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>

          <span className="font-mono text-[10px] tracking-[0.15em] text-emerald-400">
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>

        <div className="font-mono text-[10px] text-lg-muted">
          PRODUCTION MODEL · {model.production_model}
        </div>
      </div>

      {/* PRODUCTION MODEL */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <BrainCircuit
                  size={24}
                  className="text-blue-400"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-lg-muted">
                  Production detection model
                </p>

                <h2 className="mt-1 text-base font-semibold text-white">
                  {model.name}
                </h2>

                <p className="mt-1 text-[11px] text-lg-muted">
                  {model.algorithm} selected as production model
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[10px] font-medium text-emerald-400">
                {model.status}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Precision
              </p>

              <p className="mt-1 font-mono text-lg text-white">
                {formatPercent(
                  metrics.precision
                )}
              </p>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Recall
              </p>

              <p className="mt-1 font-mono text-lg text-white">
                {formatPercent(
                  metrics.recall
                )}
              </p>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                F1
              </p>

              <p className="mt-1 font-mono text-lg text-white">
                {formatPercent(
                  metrics.f1
                )}
              </p>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                ROC-AUC
              </p>

              <p className="mt-1 font-mono text-lg text-white">
                {metrics.roc_auc.toFixed(3)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Gauge
              size={22}
              className="text-cyan-400"
            />

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-lg-muted">
                Optimized threshold
              </p>

              <p className="mt-1 text-2xl font-semibold text-white">
                {threshold.value.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${Math.min(
                  threshold.value * 100,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between font-mono text-[9px] text-lg-muted">
            <span>0.00</span>
            <span>0.50</span>
            <span>1.00</span>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-lg-muted">
            Threshold optimized on validation data using explicit false-positive and false-negative costs.
          </p>
        </Card>
      </div>

      {/* CORE METRICS */}
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Accuracy"
          value={formatPercent(
            metrics.accuracy
          )}
          subtitle="Overall classification correctness"
          icon={Target}
        />

        <MetricCard
          title="Precision"
          value={formatPercent(
            metrics.precision
          )}
          subtitle="Flagged cases that were fraud"
          icon={ShieldCheck}
        />

        <MetricCard
          title="Recall"
          value={formatPercent(
            metrics.recall
          )}
          subtitle="Fraud cases successfully captured"
          icon={TrendingUp}
          tone="green"
        />

        <MetricCard
          title="F1 Score"
          value={formatPercent(
            metrics.f1
          )}
          subtitle="Precision-recall balance"
          icon={Activity}
        />
      </div>

      {/* MODEL COMPARISON */}
      <div className="mt-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Model Comparison
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Performance metrics across candidate models — XGBoost selected as production model
              </p>
            </div>

            <BarChart3
              size={18}
              className="text-blue-400"
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  {[
                    "Model",
                    "Precision",
                    "Recall",
                    "F1",
                    "ROC-AUC",
                    "Accuracy",
                    "FPR",
                    "FNR",
                    "Inference",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 pb-3 text-[9px] uppercase tracking-wider text-lg-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {model_comparison.map(
                  (item) => (
                    <tr
                      key={item.model}
                      className={`border-b border-white/[0.03] ${
                        item.selected
                          ? "bg-blue-500/[0.04]"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-white">
                            {item.model}
                          </span>

                          {item.selected && (
                            <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] text-blue-400">
                              PRODUCTION
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-white">
                        {formatPercent(
                          item.precision
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-white">
                        {formatPercent(
                          item.recall
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-white">
                        {formatPercent(
                          item.f1
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-white">
                        {item.roc_auc.toFixed(3)}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-white">
                        {formatPercent(
                          item.accuracy
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-amber-400">
                        {formatPercent(
                          item.false_positive_rate
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-red-400">
                        {formatPercent(
                          item.false_negative_rate
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[10px] text-lg-muted">
                        {item.inference_ms.toFixed(
                          3
                        )} ms
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ROC + PRECISION RECALL */}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                ROC Curve
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Receiver operating characteristic on held-out test data
              </p>
            </div>

            <div className="rounded-md border border-blue-500/20 bg-blue-500/5 px-2 py-1">
              <span className="font-mono text-[10px] text-blue-400">
                AUC {roc.auc.toFixed(3)}
              </span>
            </div>
          </div>

          <div className="mt-4 h-[280px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={roc.points}
                margin={{
                  top: 10,
                  right: 10,
                  bottom: 5,
                  left: -15,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />

                <XAxis
                  dataKey="fpr"
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(value) =>
                    value.toFixed(1)
                  }
                  tick={{
                    fontSize: 9,
                    fill: "rgba(255,255,255,0.4)",
                  }}
                />

                <YAxis
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(value) =>
                    value.toFixed(1)
                  }
                  tick={{
                    fontSize: 9,
                    fill: "rgba(255,255,255,0.4)",
                  }}
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="tpr"
                  name="True Positive Rate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between border-t border-white/5 pt-3 text-[9px] text-lg-muted">
            <span>False Positive Rate</span>
            <span>True Positive Rate</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Precision / Recall Curve
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Trade-off across classification thresholds
              </p>
            </div>

            <Target
              size={18}
              className="text-cyan-400"
            />
          </div>

          <div className="mt-4 h-[280px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={precision_recall.points}
                margin={{
                  top: 10,
                  right: 10,
                  bottom: 5,
                  left: -15,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />

                <XAxis
                  dataKey="recall"
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(value) =>
                    value.toFixed(1)
                  }
                  tick={{
                    fontSize: 9,
                    fill: "rgba(255,255,255,0.4)",
                  }}
                />

                <YAxis
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(value) =>
                    value.toFixed(1)
                  }
                  tick={{
                    fontSize: 9,
                    fill: "rgba(255,255,255,0.4)",
                  }}
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="precision"
                  name="Precision"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between border-t border-white/5 pt-3 text-[9px] text-lg-muted">
            <span>Recall</span>
            <span>Precision</span>
          </div>
        </Card>
      </div>

      {/* CONFUSION MATRIX */}
      <div className="mt-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Confusion Matrix
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Held-out test classification results
              </p>
            </div>

            <Database
              size={18}
              className="text-blue-400"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                True Negative
              </p>

              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(
                  confusion_matrix.true_negative
                )}
              </p>

              <p className="mt-1 text-[10px] text-emerald-400">
                Correctly allowed
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-4">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                False Positive
              </p>

              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(
                  confusion_matrix.false_positive
                )}
              </p>

              <p className="mt-1 text-[10px] text-amber-400">
                Legitimate cases flagged
              </p>
            </div>

            <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-4">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                False Negative
              </p>

              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(
                  confusion_matrix.false_negative
                )}
              </p>

              <p className="mt-1 text-[10px] text-red-400">
                Missed fraud
              </p>
            </div>

            <div className="rounded-lg border border-blue-500/10 bg-blue-500/5 p-4">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                True Positive
              </p>

              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(
                  confusion_matrix.true_positive
                )}
              </p>

              <p className="mt-1 text-[10px] text-blue-400">
                Fraud captured
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-lg-muted">
                Test sample count
              </span>

              <span className="font-mono text-sm text-white">
                {formatNumber(
                  totalPredictions
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* THRESHOLD OPTIMIZATION */}
      <div className="mt-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Threshold Optimization
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Test-set behavior across operating thresholds
              </p>
            </div>

            <Gauge
              size={18}
              className="text-cyan-400"
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  {[
                    "Threshold",
                    "Precision",
                    "Recall",
                    "FP",
                    "FN",
                    "TP",
                    "TN",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 pb-3 text-[9px] uppercase tracking-wider text-lg-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {threshold_optimization.map(
                  (item) => {
                    const isCurrent =
                      Math.abs(
                        item.threshold -
                          threshold.value
                      ) < 0.005;

                    return (
                      <tr
                        key={item.threshold}
                        className={`border-b border-white/[0.03] ${
                          isCurrent
                            ? "bg-blue-500/[0.05]"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-3 font-mono text-[10px] text-white">
                          {item.threshold.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-white">
                          {formatPercent(
                            item.precision
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-white">
                          {formatPercent(
                            item.recall
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-amber-400">
                          {formatNumber(
                            item.false_positive
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-red-400">
                          {formatNumber(
                            item.false_negative
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-emerald-400">
                          {formatNumber(
                            item.true_positive
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-lg-muted">
                          {formatNumber(
                            item.true_negative
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {isCurrent ? (
                            <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[8px] text-blue-400">
                              SELECTED
                            </span>
                          ) : (
                            <span className="text-[8px] text-lg-muted">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] p-3">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-blue-400"
            />

            <p className="text-[10px] leading-relaxed text-lg-muted">
              The production threshold is selected using validation data and explicit error costs. The held-out test set remains separate for final evaluation.
            </p>
          </div>
        </Card>
      </div>

      {/* FALSE POSITIVE ECONOMICS */}
      <div className="mt-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                False-Positive Economics
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Estimated business impact of legitimate transactions being flagged
              </p>
            </div>

            <AlertTriangle
              size={18}
              className="text-amber-400"
            />
          </div>

          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                False Positives
              </p>

              <p className="mt-2 text-xl font-semibold text-white">
                {formatNumber(
                  false_positive_economics.false_positives
                )}
              </p>
            </div>

            <div className="rounded-lg border border-red-500/10 bg-red-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Legitimate Revenue
              </p>

              <p className="mt-2 text-xl font-semibold text-white">
                {formatINR(
                  false_positive_economics.lost_legitimate_revenue
                )}
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Customer Friction
              </p>

              <p className="mt-2 text-xl font-semibold text-white">
                {formatINR(
                  false_positive_economics.customer_friction_cost
                )}
              </p>
            </div>

            <div className="rounded-lg border border-blue-500/10 bg-blue-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Manual Review
              </p>

              <p className="mt-2 text-xl font-semibold text-white">
                {formatINR(
                  false_positive_economics.manual_review_cost
                )}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Expected Recovery
              </p>

              <p className="mt-2 text-xl font-semibold text-emerald-400">
                {formatINR(
                  false_positive_economics.expected_recovery
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Estimated net financial impact
              </p>

              <p className="mt-1 text-[10px] text-lg-muted">
                Based on configured business assumptions
              </p>
            </div>

            <p className="font-mono text-xl font-semibold text-white">
              {formatINR(
                false_positive_economics.net_financial_impact
              )}
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.02] p-3">
            <p className="text-[9px] leading-relaxed text-lg-muted">
              These economics are illustrative estimates based on configurable assumptions, not measured financial losses from the test dataset.
            </p>
          </div>
        </Card>
      </div>

      {/* HELD-OUT TEST EVALUATION */}
      <div className="mt-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Held-Out Test Evaluation
              </h3>

              <p className="mt-1 text-[10px] text-lg-muted">
                Dataset partitioning and final production-model evaluation
              </p>
            </div>

            <Database
              size={18}
              className="text-blue-400"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Total Dataset
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(
                  evaluation.total_dataset
                )}
              </p>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Training
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(
                  evaluation.training_set
                )}
              </p>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Validation
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(
                  evaluation.validation_set
                )}
              </p>
            </div>

            <div className="rounded-lg border border-blue-500/10 bg-blue-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Held-Out Test
              </p>

              <p className="mt-2 text-lg font-semibold text-blue-400">
                {formatNumber(
                  evaluation.held_out_test_set
                )}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Fraud Samples
              </p>

              <p className="mt-2 text-lg font-semibold text-emerald-400">
                {formatNumber(
                  evaluation.fraud_samples
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* OPERATING PROFILE */}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <Card title="Operating profile">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-lg-muted">
                False-positive rate
              </span>

              <span className="font-mono text-sm text-amber-400">
                {formatPercent(
                  falsePositiveRate
                )}
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: `${Math.min(
                    falsePositiveRate * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-lg-muted">
                Flagged test cases
              </span>

              <span className="font-mono text-sm text-white">
                {formatNumber(
                  flaggedCases
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-lg-muted">
                Fraud detection rate
              </span>

              <span className="font-mono text-sm text-emerald-400">
                {formatPercent(
                  metrics.recall
                )}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Decision economics">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                FP Cost
              </p>

              <p className="mt-2 font-mono text-lg text-amber-400">
                {threshold.false_positive_cost.toFixed(
                  0
                )}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                FN Cost
              </p>

              <p className="mt-2 font-mono text-lg text-red-400">
                {threshold.false_negative_cost.toFixed(
                  0
                )}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-lg-muted">
                Validation
              </p>

              <p className="mt-2 font-mono text-lg text-white">
                {threshold.validation_cost.toFixed(
                  0
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] p-3">
            <TrendingDown
              size={16}
              className="mt-0.5 shrink-0 text-blue-400"
            />

            <p className="text-[10px] leading-relaxed text-lg-muted">
              LedgerGuard explicitly models the cost of classification errors, allowing the operating threshold to be tuned for the merchant&apos;s risk tolerance.
            </p>
          </div>
        </Card>
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="font-mono text-[9px] tracking-wider text-lg-muted">
            MODEL TELEMETRY ONLINE
          </span>
        </div>

        <div className="font-mono text-[9px] tracking-wider text-lg-muted">
          XGBOOST · COST-AWARE · HELD-OUT TEST EVALUATED
        </div>
      </div>
    </PageContainer>
  );
}