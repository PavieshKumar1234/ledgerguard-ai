'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Cpu, Sliders, TrendingUp, DollarSign, FlaskConical, Activity } from 'lucide-react';
import {
  PageHeader,
  Card,
  TableContainer,
  Th,
  Td,
  PageContainer,
} from '@/components/shared/page-primitives';
import {
  modelMetrics,
  confusionMatrix,
  rocCurveData,
  prCurveData,
  thresholdData,
  formatINR,
} from '@/lib/demo-data';

const tooltipStyle = {
  backgroundColor: '#0d1117',
  border: '1px solid #1a2029',
  borderRadius: '6px',
  fontSize: '12px',
};

function ModelComparisonTable() {
  return (
    <Card title="Model Comparison" subtitle="Performance metrics across candidate models — XGBoost selected as production model">
      <TableContainer>
        <thead>
          <tr>
            <Th>Model</Th>
            <Th>Precision</Th>
            <Th>Recall</Th>
            <Th>F1</Th>
            <Th>ROC-AUC</Th>
            <Th>Accuracy</Th>
            <Th>FPR</Th>
            <Th>FNR</Th>
            <Th>Inference (ms)</Th>
          </tr>
        </thead>
        <tbody>
          {modelMetrics.map((m, i) => {
            const isBest = m.model === 'XGBoost';
            return (
              <motion.tr
                key={m.model}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`border-b border-lg/50 hover:bg-white/[0.02] transition-colors ${
                  isBest ? 'bg-blue-500/[0.04]' : ''
                }`}
              >
                <Td className="font-mono-tech text-white">
                  <span className="flex items-center gap-1.5">
                    {m.model}
                    {isBest && <span className="text-[9px] text-lg-blue border border-blue-500/30 bg-blue-500/10 px-1 rounded">BEST</span>}
                  </span>
                </Td>
                <Td className="font-mono-tech text-white/80">{m.precision.toFixed(2)}</Td>
                <Td className="font-mono-tech text-white/80">{m.recall.toFixed(2)}</Td>
                <Td className="font-mono-tech text-white/80">{m.f1.toFixed(2)}</Td>
                <Td className={`font-mono-tech ${isBest ? 'text-emerald-400' : 'text-white/80'}`}>{m.rocAuc.toFixed(2)}</Td>
                <Td className="font-mono-tech text-white/80">{m.accuracy.toFixed(2)}</Td>
                <Td className="font-mono-tech text-rose-400">{m.fpr.toFixed(2)}</Td>
                <Td className="font-mono-tech text-amber-400">{m.fnr.toFixed(2)}</Td>
                <Td className="font-mono-tech text-lg-muted">{m.inferenceTime}</Td>
              </motion.tr>
            );
          })}
        </tbody>
      </TableContainer>
    </Card>
  );
}

function ConfusionMatrixCard() {
  const cells = [
    { label: 'True Positive', value: confusionMatrix.tp, sub: 'Fraud caught', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    { label: 'False Negative', value: confusionMatrix.fn, sub: 'Fraud missed', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
    { label: 'False Positive', value: confusionMatrix.fp, sub: 'Legit blocked', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
    { label: 'True Negative', value: confusionMatrix.tn, sub: 'Legit approved', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  ];
  return (
    <Card title="Confusion Matrix" subtitle="XGBoost — held-out test set (5,370 samples)">
      <div className="grid grid-cols-2 gap-2">
        {cells.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${c.color}`}
          >
            <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-80">{c.label}</div>
            <div className="text-2xl font-bold text-white mt-1">{c.value.toLocaleString('en-IN')}</div>
            <div className="text-[10px] font-mono-tech opacity-60 mt-0.5">{c.sub}</div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function RocCurveCard() {
  return (
    <Card title="ROC Curve" subtitle="True Positive Rate vs False Positive Rate — AUC 0.95">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rocCurveData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2029" vertical={false} />
          <XAxis dataKey="fpr" stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'FPR', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#4a5360' }} />
          <YAxis stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#4a5360' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6b7785' }} />
          <Line type="monotone" dataKey="tpr" stroke="#2b8eff" strokeWidth={2} dot={false} />
          <Line type="linear" dataKey="fpr" stroke="#3a4452" strokeWidth={1} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function PrCurveCard() {
  return (
    <Card title="Precision / Recall Curve" subtitle="Precision vs Recall trade-off">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={prCurveData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2029" vertical={false} />
          <XAxis dataKey="recall" stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Recall', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#4a5360' }} />
          <YAxis stroke="#4a5360" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#4a5360' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6b7785' }} />
          <Line type="monotone" dataKey="precision" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function ThresholdOptimizationCard() {
  const [slider, setSlider] = useState(50);
  const sliderValue = slider / 100;
  const closest = thresholdData.reduce((prev, curr) =>
    Math.abs(curr.threshold - sliderValue) < Math.abs(prev.threshold - sliderValue) ? curr : prev
  );

  return (
    <Card
      title="Threshold Optimization"
      subtitle="Adjust the decision threshold to balance precision and recall"
      action={<Sliders size={14} className="text-lg-blue" />}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-mono-tech text-lg-muted mb-1.5">
          <span>Threshold</span>
          <span className="text-white">{sliderValue.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={90}
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>
      <TableContainer>
        <thead>
          <tr>
            <Th>Threshold</Th>
            <Th>Precision</Th>
            <Th>Recall</Th>
            <Th>FP</Th>
            <Th>FN</Th>
          </tr>
        </thead>
        <tbody>
          {thresholdData.map((t) => {
            const isActive = t.threshold === closest.threshold;
            return (
              <tr
                key={t.threshold}
                className={`border-b border-lg/50 transition-colors ${
                  isActive ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'
                }`}
              >
                <Td className={`font-mono-tech ${isActive ? 'text-lg-blue' : 'text-white/80'}`}>{t.threshold.toFixed(2)}</Td>
                <Td className="font-mono-tech text-white/80">{t.precision.toFixed(2)}</Td>
                <Td className="font-mono-tech text-white/80">{t.recall.toFixed(2)}</Td>
                <Td className="font-mono-tech text-rose-400">{t.fp}</Td>
                <Td className="font-mono-tech text-amber-400">{t.fn}</Td>
              </tr>
            );
          })}
        </tbody>
      </TableContainer>
    </Card>
  );
}

function FalsePositiveEconomicsCard() {
  const rows = [
    { label: 'False Positives', value: '182', muted: false },
    { label: 'Lost Legitimate Revenue', value: formatINR(420000), muted: false },
    { label: 'Customer Friction Cost', value: formatINR(85000), muted: false },
    { label: 'Manual Review Cost', value: formatINR(120000), muted: false },
    { label: 'Expected Recovery', value: formatINR(380000), muted: false },
    { label: 'Net Financial Impact', value: formatINR(850000), highlight: true },
  ];
  return (
    <Card title="False-Positive Economics" subtitle="Financial impact of false positives and recovery economics" action={<DollarSign size={14} className="text-emerald-400" />}>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center justify-between text-[11px] py-1.5 px-2 rounded ${
              r.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-lg-muted">{r.label}</span>
            <span className={`font-mono-tech ${r.highlight ? 'text-emerald-400 font-bold' : 'text-white'}`}>{r.value}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function HeldOutTestCard() {
  const rows = [
    { label: 'Training Set', value: '12,400' },
    { label: 'Validation Set', value: '3,100' },
    { label: 'Held-Out Test Set', value: '5,370' },
    { label: 'Test Sample Count', value: '5,370' },
  ];
  const metrics = [
    { label: 'Precision', value: '0.92' },
    { label: 'Recall', value: '0.88' },
    { label: 'F1', value: '0.90' },
  ];
  return (
    <Card title="Held-Out Test Evaluation" subtitle="Final model evaluation on unseen test data" action={<FlaskConical size={14} className="text-lg-blue" />}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-[11px] py-1">
              <span className="text-lg-muted">{r.label}</span>
              <span className="font-mono-tech text-white">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="border-l border-lg pl-3">
          <div className="text-[10px] font-mono-tech text-lg-muted uppercase tracking-wider mb-2">Final Test Metrics</div>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between text-[11px]">
                <span className="text-lg-muted">{m.label}</span>
                <span className="font-mono-tech text-emerald-400">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ModelIntelligencePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Model Intelligence"
        subtitle="ML model evaluation, performance metrics and threshold optimization"
        icon={Cpu}
      />

      <ModelComparisonTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConfusionMatrixCard />
        <FalsePositiveEconomicsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RocCurveCard />
        <PrCurveCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ThresholdOptimizationCard />
        <HeldOutTestCard />
      </div>
    </PageContainer>
  );
}
