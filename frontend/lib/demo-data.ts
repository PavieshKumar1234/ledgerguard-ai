// LedgerGuard synthetic demo data — all values are fictional

export const formatINR = (value: number): string => {
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
};

export const kpis = [
  {
    label: 'Revenue Protected',
    value: 48200000,
    change: 12.4,
    trend: 'up' as const,
    sparkline: [32, 35, 33, 38, 42, 40, 45, 48],
    color: '#2b8eff',
  },
  {
    label: 'Potential Loss',
    value: 8750000,
    change: -8.2,
    trend: 'down' as const,
    sparkline: [15, 14, 16, 12, 11, 10, 9, 8],
    color: '#f43f5e',
  },
  {
    label: 'Revenue Recovered',
    value: 31200000,
    change: 18.7,
    trend: 'up' as const,
    sparkline: [20, 22, 25, 24, 28, 30, 31, 31],
    color: '#22c55e',
  },
  {
    label: 'Active Risk Exposure',
    value: 15400000,
    change: 3.1,
    trend: 'up' as const,
    sparkline: [12, 13, 14, 13, 15, 15, 15, 15],
    color: '#f59e0b',
  },
  {
    label: 'Chargeback Exposure',
    value: 6200000,
    change: -5.3,
    trend: 'down' as const,
    sparkline: [8, 7, 7, 6, 6, 6, 6, 6],
    color: '#a855f7',
  },
  {
    label: 'Recovery Rate',
    value: 64.8,
    isPercentage: true,
    change: 2.4,
    trend: 'up' as const,
    sparkline: [58, 60, 61, 62, 63, 64, 64, 65],
    color: '#00d4ff',
  },
];

export const riskTimelineData = [
  { hour: '00:00', fraud: 12, chargebacks: 4, refunds: 8, recovery: 15 },
  { hour: '03:00', fraud: 8, chargebacks: 2, refunds: 5, recovery: 10 },
  { hour: '06:00', fraud: 15, chargebacks: 6, refunds: 10, recovery: 20 },
  { hour: '09:00', fraud: 28, chargebacks: 12, refunds: 18, recovery: 35 },
  { hour: '12:00', fraud: 42, chargebacks: 18, refunds: 25, recovery: 48 },
  { hour: '15:00', fraud: 35, chargebacks: 14, refunds: 20, recovery: 40 },
  { hour: '18:00', fraud: 22, chargebacks: 8, refunds: 12, recovery: 28 },
  { hour: '21:00', fraud: 18, chargebacks: 5, refunds: 9, recovery: 22 },
  { hour: '24:00', fraud: 14, chargebacks: 3, refunds: 7, recovery: 18 },
];

export const riskDistribution = [
  { name: 'Critical', value: 142, color: '#f43f5e' },
  { name: 'High', value: 387, color: '#f59e0b' },
  { name: 'Medium', value: 892, color: '#2b8eff' },
  { name: 'Low', value: 2104, color: '#22c55e' },
];

export const recoveryFunnel = [
  { stage: 'Potential Loss', value: 875, percentage: 100 },
  { stage: 'Identified', value: 620, percentage: 71 },
  { stage: 'Eligible', value: 445, percentage: 51 },
  { stage: 'Actioned', value: 312, percentage: 36 },
  { stage: 'Recovered', value: 248, percentage: 28 },
];

export const criticalFeed = [
  {
    id: 'ALERT-9182',
    type: 'Fraud Spike',
    severity: 'critical',
    message: 'Transaction velocity anomaly detected — 340% above baseline',
    exposure: 1250000,
    time: '2 min ago',
  },
  {
    id: 'ALERT-9179',
    type: 'Chargeback Spike',
    severity: 'critical',
    message: 'Chargeback rate exceeded 1.2% threshold for Electronics category',
    exposure: 890000,
    time: '8 min ago',
  },
  {
    id: 'ALERT-9175',
    type: 'Network Anomaly',
    severity: 'high',
    message: 'Coordinated fraud network detected — 7 shared devices, 14 accounts',
    exposure: 2100000,
    time: '15 min ago',
  },
  {
    id: 'ALERT-9170',
    type: 'Recovery Opportunity',
    severity: 'high',
    message: '₹3.2L recoverable revenue identified in dispute window',
    exposure: 3200000,
    time: '23 min ago',
  },
  {
    id: 'ALERT-9168',
    type: 'AI Discovery',
    severity: 'medium',
    message: 'New fraud pattern identified — synthetic identity cluster',
    exposure: 540000,
    time: '31 min ago',
  },
  {
    id: 'ALERT-9162',
    type: 'Refund Abuse',
    severity: 'medium',
    message: 'Customer CUST-19384 shows 4x baseline refund rate',
    exposure: 180000,
    time: '45 min ago',
  },
];

export const recentTransactions = [
  {
    id: 'TXN-82931',
    time: '14:32:08',
    customer: 'CUST-19384',
    amount: 42500,
    method: 'Visa ••4821',
    location: 'Mumbai, IN',
    riskScore: 87,
    riskLevel: 'critical',
    decision: 'Decline',
    status: 'Blocked',
  },
  {
    id: 'TXN-82942',
    time: '14:31:55',
    customer: 'CUST-21034',
    amount: 12800,
    method: 'Mastercard ••7702',
    location: 'Bengaluru, IN',
    riskScore: 62,
    riskLevel: 'high',
    decision: 'Review',
    status: 'Investigating',
  },
  {
    id: 'TXN-82938',
    time: '14:31:41',
    customer: 'CUST-18721',
    amount: 8999,
    method: 'UPI — gpay@okaxis',
    location: 'Delhi, IN',
    riskScore: 28,
    riskLevel: 'low',
    decision: 'Approve',
    status: 'Completed',
  },
  {
    id: 'TXN-82935',
    time: '14:31:22',
    customer: 'CUST-22018',
    amount: 76500,
    method: 'Amex ••1004',
    location: 'Pune, IN',
    riskScore: 73,
    riskLevel: 'high',
    decision: 'Review',
    status: 'Investigating',
  },
  {
    id: 'TXN-82929',
    time: '14:30:58',
    customer: 'CUST-19384',
    amount: 18500,
    method: 'Visa ••4821',
    location: 'Mumbai, IN',
    riskScore: 91,
    riskLevel: 'critical',
    decision: 'Decline',
    status: 'Blocked',
  },
  {
    id: 'TXN-82925',
    time: '14:30:30',
    customer: 'CUST-24091',
    amount: 3200,
    method: 'RuPay ••3398',
    location: 'Hyderabad, IN',
    riskScore: 15,
    riskLevel: 'low',
    decision: 'Approve',
    status: 'Completed',
  },
  {
    id: 'TXN-82920',
    time: '14:30:12',
    customer: 'CUST-16703',
    amount: 24999,
    method: 'Mastercard ••5519',
    location: 'Chennai, IN',
    riskScore: 45,
    riskLevel: 'medium',
    decision: 'Approve',
    status: 'Completed',
  },
];

export const geographicExposure = [
  { region: 'Mumbai', transactions: 4820, exposure: 4200000, risk: 'high' },
  { region: 'Delhi', transactions: 3940, exposure: 3100000, risk: 'medium' },
  { region: 'Bengaluru', transactions: 3210, exposure: 2800000, risk: 'medium' },
  { region: 'Chennai', transactions: 2180, exposure: 1900000, risk: 'low' },
  { region: 'Hyderabad', transactions: 1840, exposure: 1500000, risk: 'low' },
  { region: 'Pune', transactions: 1290, exposure: 1200000, risk: 'high' },
  { region: 'Kolkata', transactions: 980, exposure: 890000, risk: 'medium' },
];

export const aiExecutiveBrief = {
  summary: 'Risk engine flagged a 340% velocity spike originating from a coordinated device network in Mumbai. 14 accounts sharing 7 devices have been auto-escalated to investigation.',
  changes: 'Fraud activity up 340% in last 2 hours. Chargeback rate for Electronics category exceeded 1.2% threshold.',
  impact: '₹12.5L potential exposure if unchecked. ₹3.2L identified as recoverable.',
  recommendation: 'Escalate CASE-10482 to senior analyst. Enable enhanced velocity rules for Electronics category. Initiate recovery workflow for eligible disputes.',
  confidence: 94,
};

export const navItems = [
  { label: 'Overview', icon: 'LayoutDashboard', path: '/overview' },
  { label: 'Transactions', icon: 'ArrowLeftRight', path: '/transactions' },
  { label: 'Risk Intelligence', icon: 'ShieldAlert', path: '/risk-intelligence' },
  { label: 'Investigations', icon: 'Search', path: '/investigations' },
  { label: 'Alerts', icon: 'Bell', path: '/alerts' },
  { label: 'Revenue Recovery', icon: 'TrendingUp', path: '/revenue-recovery' },
  { label: 'Chargebacks', icon: 'FileWarning', path: '/chargebacks' },
  { label: 'Network Intelligence', icon: 'Network', path: '/network-intelligence' },
  { label: 'AI Risk Copilot', icon: 'BrainCircuit', path: '/ai-risk-copilot' },
  { label: 'Model Intelligence', icon: 'Cpu', path: '/model-intelligence' },
  { label: 'Financial Analytics', icon: 'BarChart3', path: '/financial-analytics' },
  { label: 'Customer Intelligence', icon: 'Users', path: '/customer-intelligence' },
  { label: 'Device Intelligence', icon: 'Smartphone', path: '/device-intelligence' },
  { label: 'Reports', icon: 'FileText', path: '/reports' },
  { label: 'Users & RBAC', icon: 'UserCog', path: '/users' },
  { label: 'Audit Logs', icon: 'ScrollText', path: '/audit-logs' },
  { label: 'Settings', icon: 'Settings', path: '/settings' },
];

export const systemStatus = [
  { label: 'System', status: 'operational' },
  { label: 'Risk Engine', status: 'operational' },
  { label: 'AI Agents', status: 'operational' },
  { label: 'Data Pipeline', status: 'operational' },
];

export const riskLevelColors: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  high: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  medium: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  low: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

// --- Additional synthetic data for dedicated pages ---

export const allTransactions = [
  ...recentTransactions,
  { id: 'TXN-82918', time: '14:29:50', customer: 'CUST-19203', amount: 5499, method: 'Visa ••9201', location: 'Kolkata, IN', riskScore: 38, riskLevel: 'medium', decision: 'Approve', status: 'Completed' },
  { id: 'TXN-82915', time: '14:29:31', customer: 'CUST-25501', amount: 92000, method: 'Mastercard ••3344', location: 'Mumbai, IN', riskScore: 84, riskLevel: 'critical', decision: 'Decline', status: 'Blocked' },
  { id: 'TXN-82910', time: '14:29:05', customer: 'CUST-18721', amount: 1500, method: 'UPI — gpay@okaxis', location: 'Delhi, IN', riskScore: 12, riskLevel: 'low', decision: 'Approve', status: 'Completed' },
  { id: 'TXN-82905', time: '14:28:42', customer: 'CUST-21034', amount: 38700, method: 'Amex ••1004', location: 'Bengaluru, IN', riskScore: 67, riskLevel: 'high', decision: 'Review', status: 'Investigating' },
  { id: 'TXN-82898', time: '14:28:15', customer: 'CUST-16703', amount: 6800, method: 'RuPay ••5519', location: 'Chennai, IN', riskScore: 22, riskLevel: 'low', decision: 'Approve', status: 'Completed' },
  { id: 'TXN-82891', time: '14:27:58', customer: 'CUST-22018', amount: 14500, method: 'Visa ••4821', location: 'Pune, IN', riskScore: 55, riskLevel: 'medium', decision: 'Review', status: 'Investigating' },
  { id: 'TXN-82885', time: '14:27:30', customer: 'CUST-19384', amount: 67000, method: 'Mastercard ••7702', location: 'Mumbai, IN', riskScore: 89, riskLevel: 'critical', decision: 'Decline', status: 'Blocked' },
  { id: 'TXN-82880', time: '14:27:12', customer: 'CUST-24091', amount: 4200, method: 'UPI — phonepe@okaxis', location: 'Hyderabad, IN', riskScore: 18, riskLevel: 'low', decision: 'Approve', status: 'Completed' },
];

export const riskFactorData = [
  { factor: 'Velocity', score: 87 },
  { factor: 'Device Trust', score: 34 },
  { factor: 'Geo Mismatch', score: 72 },
  { factor: 'Behavioral', score: 58 },
  { factor: 'Network', score: 91 },
  { factor: 'Card Age', score: 45 },
  { factor: 'Refund History', score: 62 },
  { factor: 'IP Reputation', score: 29 },
];

export const riskTrendData = [
  { day: 'Mon', critical: 12, high: 28, medium: 55, low: 120 },
  { day: 'Tue', critical: 15, high: 32, medium: 48, low: 135 },
  { day: 'Wed', critical: 8, high: 25, medium: 62, low: 140 },
  { day: 'Thu', critical: 22, high: 38, medium: 51, low: 128 },
  { day: 'Fri', critical: 18, high: 42, medium: 58, low: 145 },
  { day: 'Sat', critical: 25, high: 35, medium: 44, low: 110 },
  { day: 'Sun', critical: 14, high: 30, medium: 50, low: 132 },
];

export const fraudSpikeData = {
  current: 340,
  baseline: 100,
  deviation: 240,
  affectedTransactions: 87,
  exposure: 1250000,
  explanation: 'Coordinated fraud network using 7 shared devices across 14 accounts. Transaction velocity 340% above 30-day baseline. Primary category: Electronics. Geographic concentration: Mumbai.',
};

export const investigations = [
  { id: 'CASE-10482', transaction: 'TXN-82931', customer: 'CUST-19384', risk: 'critical', exposure: 42500, reason: 'Velocity anomaly + shared device', analyst: 'A. Kapoor', status: 'Investigating', created: '2h ago', priority: 'P1' },
  { id: 'CASE-10479', transaction: 'TXN-82915', customer: 'CUST-25501', risk: 'critical', exposure: 92000, reason: 'High-value fraud pattern', analyst: 'P. Sharma', status: 'New', created: '3h ago', priority: 'P1' },
  { id: 'CASE-10475', transaction: 'TXN-82905', customer: 'CUST-21034', risk: 'high', exposure: 38700, reason: 'Device fingerprint mismatch', analyst: 'Unassigned', status: 'New', created: '4h ago', priority: 'P2' },
  { id: 'CASE-10470', transaction: 'TXN-82891', customer: 'CUST-22018', risk: 'medium', exposure: 14500, reason: 'Behavioral anomaly', analyst: 'R. Iyer', status: 'Awaiting Review', created: '6h ago', priority: 'P3' },
  { id: 'CASE-10465', transaction: 'TXN-82885', customer: 'CUST-19384', risk: 'critical', exposure: 67000, reason: 'Repeat offender — device network', analyst: 'A. Kapoor', status: 'Escalated', created: '8h ago', priority: 'P1' },
  { id: 'CASE-10458', transaction: 'TXN-82880', customer: 'CUST-24091', risk: 'low', exposure: 4200, reason: 'False positive review', analyst: 'S. Nair', status: 'Resolved', created: '12h ago', priority: 'P4' },
  { id: 'CASE-10452', transaction: 'TXN-82872', customer: 'CUST-16703', risk: 'medium', exposure: 8900, reason: 'Geo mismatch', analyst: 'R. Iyer', status: 'False Positive', created: '1d ago', priority: 'P3' },
];

export const investigationTimeline = [
  { step: 'Detected', time: '14:32:08', desc: 'Risk engine flagged TXN-82931 with score 87' },
  { step: 'Risk Model', time: '14:32:09', desc: 'XGBoost model scored 0.87 — velocity + network features dominant' },
  { step: 'Anomaly', time: '14:32:10', desc: 'Anomaly detector: 340% velocity spike for CUST-19384' },
  { step: 'Customer History', time: '14:32:11', desc: '3 prior chargebacks, 8 refunds in 30 days' },
  { step: 'Device Network', time: '14:32:12', desc: 'Device DEV-8201 linked to 14 accounts, 7 shared IPs' },
  { step: 'Similar Cases', time: '14:32:13', desc: '5 similar cases found — 4 confirmed fraud' },
  { step: 'AI Investigation', time: '14:32:14', desc: 'AI agent recommends: Decline + Escalate' },
  { step: 'Analyst Decision', time: '14:35:00', desc: 'Pending analyst review' },
];

export const alerts = [
  ...criticalFeed.map(a => ({ ...a, status: 'active' })),
  { id: 'ALERT-9155', type: 'Device Anomaly', severity: 'medium', message: 'New device fingerprint from high-risk region', exposure: 340000, time: '1h ago' },
  { id: 'ALERT-9148', type: 'Velocity Anomaly', severity: 'high', message: 'Customer CUST-25501: 12 transactions in 3 minutes', exposure: 920000, time: '2h ago' },
  { id: 'ALERT-9140', type: 'Geographic Anomaly', severity: 'low', message: 'Unusual transaction pattern from new geographic cluster', exposure: 120000, time: '3h ago' },
];

export const recoveryKpis = [
  { label: 'Potential Recoverable', value: 8750000, change: 12.4, trend: 'up' as const, color: '#2b8eff' },
  { label: 'Recovered', value: 31200000, change: 18.7, trend: 'up' as const, color: '#22c55e' },
  { label: 'Recovery Rate', value: 64.8, isPercentage: true, change: 2.4, trend: 'up' as const, color: '#00d4ff' },
  { label: 'Pending Recovery', value: 5600000, change: -3.2, trend: 'down' as const, color: '#f59e0b' },
  { label: 'Recovery Opportunities', value: 142, change: 8, trend: 'up' as const, color: '#a855f7' },
];

export const recoveryOpportunities = [
  { id: 'REC-3401', transaction: 'TXN-82942', amount: 12800, probability: 82, effort: 'Low', action: 'Submit dispute evidence', impact: 'High' },
  { id: 'REC-3398', transaction: 'TXN-82905', amount: 38700, probability: 67, effort: 'Medium', action: 'Contact customer + dispute', impact: 'High' },
  { id: 'REC-3395', transaction: 'TXN-82891', amount: 14500, probability: 54, effort: 'Low', action: 'Auto-submit evidence', impact: 'Medium' },
  { id: 'REC-3390', transaction: 'TXN-82872', amount: 8900, probability: 38, effort: 'High', action: 'Manual investigation', impact: 'Low' },
  { id: 'REC-3385', transaction: 'TXN-82880', amount: 4200, probability: 91, effort: 'Low', action: 'Auto-recover', impact: 'Low' },
];

export const recoveryForecast = [
  { period: '30-Day', forecast: 8200000, confidence: 88 },
  { period: '60-Day', forecast: 14500000, confidence: 76 },
  { period: '90-Day', forecast: 21800000, confidence: 64 },
];

export const chargebacks = [
  { id: 'CB-8291', transaction: 'TXN-82855', customer: 'CUST-19384', amount: 42500, reason: 'Fraudulent transaction', status: 'Open', evidenceScore: 72, deadline: '3 days', winProbability: 68 },
  { id: 'CB-8285', transaction: 'TXN-82810', customer: 'CUST-21034', amount: 12800, reason: 'Product not received', status: 'Won', evidenceScore: 95, deadline: 'Closed', winProbability: 92 },
  { id: 'CB-8279', transaction: 'TXN-82765', customer: 'CUST-22018', amount: 76500, reason: 'Service not provided', status: 'Lost', evidenceScore: 28, deadline: 'Closed', winProbability: 15 },
  { id: 'CB-8272', transaction: 'TXN-82915', customer: 'CUST-25501', amount: 92000, reason: 'Unauthorized transaction', status: 'Pending', evidenceScore: 0, deadline: '8 days', winProbability: 0 },
  { id: 'CB-8268', transaction: 'TXN-82698', customer: 'CUST-18721', amount: 8999, reason: 'Duplicate charge', status: 'Open', evidenceScore: 85, deadline: '5 days', winProbability: 78 },
  { id: 'CB-8261', transaction: 'TXN-82650', customer: 'CUST-16703', amount: 24999, reason: 'Product defective', status: 'Won', evidenceScore: 88, deadline: 'Closed', winProbability: 85 },
];

export const chargebackKpis = [
  { label: 'Open Disputes', value: 47, change: 5, trend: 'up' as const, color: '#f59e0b' },
  { label: 'Won', value: 182, change: 12, trend: 'up' as const, color: '#22c55e' },
  { label: 'Lost', value: 34, change: -8, trend: 'down' as const, color: '#f43f5e' },
  { label: 'Pending', value: 12, change: 2, trend: 'up' as const, color: '#2b8eff' },
  { label: 'Total Exposure', value: 6200000, change: -5.3, trend: 'down' as const, color: '#a855f7' },
  { label: 'Win Rate', value: 78.4, isPercentage: true, change: 3.1, trend: 'up' as const, color: '#00d4ff' },
];

export const networkEntities = [
  { id: 'CUST-19384', type: 'Customer', risk: 91, connections: 8, x: 50, y: 30 },
  { id: 'DEV-8201', type: 'Device', risk: 87, connections: 14, x: 30, y: 50 },
  { id: 'IP-10.42.1.88', type: 'IP', risk: 78, connections: 7, x: 70, y: 50 },
  { id: 'CUST-25501', type: 'Customer', risk: 84, connections: 5, x: 20, y: 75 },
  { id: 'CUST-21034', type: 'Customer', risk: 62, connections: 4, x: 80, y: 75 },
  { id: 'ACC-44021', type: 'Account', risk: 73, connections: 6, x: 50, y: 55 },
  { id: 'DEV-8205', type: 'Device', risk: 65, connections: 9, x: 65, y: 20 },
  { id: 'IP-10.42.1.92', type: 'IP', risk: 55, connections: 4, x: 35, y: 20 },
];

export const networkEdges = [
  { from: 'CUST-19384', to: 'DEV-8201' },
  { from: 'CUST-19384', to: 'IP-10.42.1.88' },
  { from: 'DEV-8201', to: 'ACC-44021' },
  { from: 'DEV-8201', to: 'CUST-25501' },
  { from: 'DEV-8201', to: 'CUST-21034' },
  { from: 'IP-10.42.1.88', to: 'ACC-44021' },
  { from: 'CUST-25501', to: 'DEV-8205' },
  { from: 'DEV-8205', to: 'IP-10.42.1.92' },
  { from: 'CUST-21034', to: 'IP-10.42.1.88' },
];

export const aiCopilotSuggestions = [
  'Why was TXN-82931 flagged?',
  'Investigate CASE-10482',
  'What caused the risk spike?',
  'Find similar cases',
  'Which revenue is recoverable?',
  'Explain this model decision',
  'Show suspicious customer networks',
  'Generate chargeback evidence',
  'Summarize today\'s risk exposure',
  'Identify the biggest financial threat',
];

export const aiAgentActivity = [
  { agent: 'Detection Agent', task: 'Analyze transaction velocity for CUST-19384', status: 'Completed', confidence: 94, timestamp: '14:32:08' },
  { agent: 'Investigation Agent', task: 'Build case CASE-10482 evidence package', status: 'Running', confidence: 0, timestamp: '14:32:14' },
  { agent: 'Recovery Agent', task: 'Prioritize 142 recovery opportunities', status: 'Completed', confidence: 88, timestamp: '14:30:00' },
  { agent: 'Evidence Agent', task: 'Generate chargeback response for CB-8291', status: 'Waiting', confidence: 0, timestamp: '14:28:00' },
  { agent: 'Policy Agent', task: 'Evaluate velocity rules for Electronics', status: 'Completed', confidence: 91, timestamp: '14:25:00' },
  { agent: 'Analyst Copilot', task: 'Prepare executive brief for risk spike', status: 'Completed', confidence: 94, timestamp: '14:32:15' },
];

export const modelMetrics = [
  { model: 'Logistic Regression', precision: 0.82, recall: 0.76, f1: 0.79, rocAuc: 0.87, accuracy: 0.84, fpr: 0.18, fnr: 0.24, inferenceTime: 2 },
  { model: 'Random Forest', precision: 0.88, recall: 0.83, f1: 0.85, rocAuc: 0.91, accuracy: 0.89, fpr: 0.12, fnr: 0.17, inferenceTime: 15 },
  { model: 'XGBoost', precision: 0.92, recall: 0.88, f1: 0.90, rocAuc: 0.95, accuracy: 0.93, fpr: 0.08, fnr: 0.12, inferenceTime: 8 },
];

export const confusionMatrix = {
  tp: 842, tn: 4218, fp: 182, fn: 128,
};

export const rocCurveData = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.02, tpr: 0.45 },
  { fpr: 0.05, tpr: 0.68 },
  { fpr: 0.08, tpr: 0.82 },
  { fpr: 0.12, tpr: 0.89 },
  { fpr: 0.18, tpr: 0.94 },
  { fpr: 0.25, tpr: 0.97 },
  { fpr: 0.40, tpr: 0.99 },
  { fpr: 1, tpr: 1 },
];

export const prCurveData = [
  { recall: 0, precision: 1 },
  { recall: 0.2, precision: 0.96 },
  { recall: 0.4, precision: 0.94 },
  { recall: 0.6, precision: 0.91 },
  { recall: 0.7, precision: 0.88 },
  { recall: 0.8, precision: 0.85 },
  { recall: 0.88, precision: 0.82 },
  { recall: 0.95, precision: 0.72 },
  { recall: 1, precision: 0.48 },
];

export const thresholdData = [
  { threshold: 0.3, precision: 0.72, recall: 0.96, fp: 420, fn: 28 },
  { threshold: 0.5, precision: 0.85, recall: 0.88, fp: 182, fn: 128 },
  { threshold: 0.7, precision: 0.92, recall: 0.78, fp: 85, fn: 240 },
  { threshold: 0.8, precision: 0.95, recall: 0.68, fp: 42, fn: 340 },
  { threshold: 0.9, precision: 0.97, recall: 0.52, fp: 18, fn: 520 },
];

export const financialAnalyticsData = [
  { month: 'Jan', protected: 32, recovered: 18, lost: 4 },
  { month: 'Feb', protected: 35, recovered: 21, lost: 3 },
  { month: 'Mar', protected: 38, recovered: 24, lost: 5 },
  { month: 'Apr', protected: 42, recovered: 26, lost: 4 },
  { month: 'May', protected: 45, recovered: 28, lost: 6 },
  { month: 'Jun', protected: 48, recovered: 31, lost: 3 },
];

export const lossBreakdown = [
  { category: 'Fraud Loss', value: 2400000, color: '#f43f5e' },
  { category: 'Chargeback Loss', value: 1800000, color: '#f59e0b' },
  { category: 'Refund Loss', value: 1200000, color: '#a855f7' },
  { category: 'Operational', value: 600000, color: '#2b8eff' },
];

export const customers = [
  { id: 'CUST-19384', name: 'Rahul Verma', email: 'rahul.v@email.com', age: 14, volume: 87, spend: 485000, refundRate: 18.5, chargebackRate: 8.2, riskScore: 91, ltv: 12000, location: 'Mumbai' },
  { id: 'CUST-21034', name: 'Priya Singh', email: 'priya.s@email.com', age: 320, volume: 142, spend: 1240000, refundRate: 3.2, chargebackRate: 1.1, riskScore: 28, ltv: 340000, location: 'Bengaluru' },
  { id: 'CUST-18721', name: 'Amit Kumar', email: 'amit.k@email.com', age: 210, volume: 98, spend: 680000, refundRate: 5.8, chargebackRate: 2.4, riskScore: 35, ltv: 180000, location: 'Delhi' },
  { id: 'CUST-22018', name: 'Sneha Patel', email: 'sneha.p@email.com', age: 45, volume: 52, spend: 320000, refundRate: 12.1, chargebackRate: 5.8, riskScore: 73, ltv: 45000, location: 'Pune' },
  { id: 'CUST-25501', name: 'Vikram Rao', email: 'vikram.r@email.com', age: 7, volume: 22, spend: 890000, refundRate: 22.3, chargebackRate: 14.5, riskScore: 84, ltv: 8000, location: 'Mumbai' },
  { id: 'CUST-16703', name: 'Deepak Gupta', email: 'deepak.g@email.com', age: 480, volume: 210, spend: 2100000, refundRate: 2.1, chargebackRate: 0.8, riskScore: 15, ltv: 580000, location: 'Chennai' },
];

export const customerTimeline = [
  { event: 'Purchase', desc: 'TXN-82931 — ₹42,500', time: '14:32', type: 'purchase' },
  { event: 'Risk Flag', desc: 'Risk score 87 — velocity anomaly', time: '14:32', type: 'risk' },
  { event: 'Chargeback', desc: 'CB-8291 — ₹42,500 dispute', time: '2h ago', type: 'chargeback' },
  { event: 'Refund', desc: 'TXN-82855 — ₹12,000 refunded', time: '1d ago', type: 'refund' },
  { event: 'Purchase', desc: 'TXN-82872 — ₹18,500', time: '2d ago', type: 'purchase' },
  { event: 'Risk Flag', desc: 'Device DEV-8201 flagged', time: '3d ago', type: 'risk' },
];

export const devices = [
  { id: 'DEV-8201', firstSeen: '14 days ago', lastSeen: '2 min ago', accounts: 14, transactions: 87, riskScore: 87, locations: 'Mumbai, Pune', ips: 7 },
  { id: 'DEV-8205', firstSeen: '8 days ago', lastSeen: '1h ago', accounts: 9, transactions: 42, riskScore: 65, locations: 'Mumbai', ips: 3 },
  { id: 'DEV-8210', firstSeen: '120 days ago', lastSeen: '5h ago', accounts: 2, transactions: 210, riskScore: 22, locations: 'Bengaluru', ips: 2 },
  { id: 'DEV-8215', firstSeen: '30 days ago', lastSeen: '3h ago', accounts: 5, transactions: 68, riskScore: 54, locations: 'Delhi, Kolkata', ips: 4 },
  { id: 'DEV-8220', firstSeen: '3 days ago', lastSeen: '12 min ago', accounts: 11, transactions: 34, riskScore: 78, locations: 'Mumbai', ips: 5 },
];

export const reports = [
  { id: 'RPT-001', name: 'Risk Summary — September 2026', type: 'Risk Summary', status: 'Ready', date: 'Sep 1, 2026', size: '2.4 MB' },
  { id: 'RPT-002', name: 'Revenue Recovery — Q3 2026', type: 'Revenue Recovery', status: 'Ready', date: 'Sep 1, 2026', size: '1.8 MB' },
  { id: 'RPT-003', name: 'Chargeback Performance — August', type: 'Chargeback Performance', status: 'Ready', date: 'Aug 31, 2026', size: '3.2 MB' },
  { id: 'RPT-004', name: 'Fraud Intelligence — Weekly', type: 'Fraud Intelligence', status: 'Generating', date: 'Sep 3, 2026', size: '—' },
  { id: 'RPT-005', name: 'Model Performance — September', type: 'Model Performance', status: 'Scheduled', date: 'Sep 7, 2026', size: '—' },
  { id: 'RPT-006', name: 'Executive Report — Q3 2026', type: 'Executive Report', status: 'Ready', date: 'Aug 30, 2026', size: '5.1 MB' },
  { id: 'RPT-007', name: 'Financial Impact — August', type: 'Financial Impact', status: 'Failed', date: 'Aug 28, 2026', size: '—' },
];

export const users = [
  { name: 'Arjun Kapoor', email: 'arjun.kapoor@ledgerguard.io', role: 'Merchant Admin', status: 'Active', lastLogin: '2 min ago', created: 'Jan 15, 2026' },
  { name: 'Priya Sharma', email: 'priya.sharma@ledgerguard.io', role: 'Risk Analyst', status: 'Active', lastLogin: '1h ago', created: 'Feb 3, 2026' },
  { name: 'Rahul Iyer', email: 'rahul.iyer@ledgerguard.io', role: 'Risk Analyst', status: 'Active', lastLogin: '3h ago', created: 'Feb 10, 2026' },
  { name: 'Sneha Nair', email: 'sneha.nair@ledgerguard.io', role: 'Finance Controller', status: 'Active', lastLogin: '5h ago', created: 'Mar 1, 2026' },
  { name: 'Vikram Reddy', email: 'vikram.reddy@ledgerguard.io', role: 'Operations', status: 'Suspended', lastLogin: '3d ago', created: 'Mar 15, 2026' },
  { name: 'Anita Desai', email: 'anita.desai@ledgerguard.io', role: 'Executive', status: 'Active', lastLogin: '12h ago', created: 'Jan 5, 2026' },
];

export const rolePermissions = [
  { category: 'Transactions', admin: true, analyst: true, finance: false, ops: true, exec: false },
  { category: 'Investigations', admin: true, analyst: true, finance: false, ops: true, exec: false },
  { category: 'Alerts', admin: true, analyst: true, finance: false, ops: true, exec: false },
  { category: 'Chargebacks', admin: true, analyst: false, finance: true, ops: false, exec: false },
  { category: 'Recovery', admin: true, analyst: false, finance: true, ops: true, exec: true },
  { category: 'Analytics', admin: true, analyst: true, finance: true, ops: false, exec: true },
  { category: 'AI Copilot', admin: true, analyst: true, finance: false, ops: false, exec: false },
  { category: 'Reports', admin: true, analyst: false, finance: true, ops: false, exec: true },
  { category: 'Users', admin: true, analyst: false, finance: false, ops: false, exec: false },
  { category: 'Settings', admin: true, analyst: false, finance: false, ops: false, exec: false },
  { category: 'Audit Logs', admin: true, analyst: false, finance: false, ops: false, exec: true },
];

export const auditLogs = [
  { time: '14:35:22', user: 'A. Kapoor', role: 'Admin', action: 'Decline', entity: 'TXN-82931', case: 'CASE-10482', decision: 'Decline', ip: '10.42.1.50', result: 'Success' },
  { time: '14:32:14', user: 'AI Agent', role: 'System', action: 'Auto-flag', entity: 'TXN-82931', case: 'CASE-10482', decision: 'Flag', ip: '—', result: 'Success' },
  { time: '14:28:00', user: 'P. Sharma', role: 'Analyst', action: 'Escalate', entity: 'CASE-10465', case: 'CASE-10465', decision: 'Escalate', ip: '10.42.1.51', result: 'Success' },
  { time: '14:15:00', user: 'S. Nair', role: 'Finance', action: 'Export', entity: 'RPT-002', case: '—', decision: 'Export', ip: '10.42.1.53', result: 'Success' },
  { time: '13:45:00', user: 'R. Iyer', role: 'Analyst', action: 'Resolve', entity: 'CASE-10458', case: 'CASE-10458', decision: 'False Positive', ip: '10.42.1.52', result: 'Success' },
  { time: '12:30:00', user: 'A. Desai', role: 'Executive', action: 'View', entity: 'RPT-006', case: '—', decision: 'View', ip: '10.42.1.55', result: 'Success' },
  { time: '11:20:00', user: 'V. Reddy', role: 'Operations', action: 'Login', entity: '—', case: '—', decision: '—', ip: '10.42.1.54', result: 'Failed' },
  { time: '10:15:00', user: 'A. Kapoor', role: 'Admin', action: 'Update Policy', entity: 'Velocity Rules', case: '—', decision: 'Update', ip: '10.42.1.50', result: 'Success' },
];

export const settingsSections = [
  { label: 'Merchant Profile', icon: 'Building2', description: 'Organization, industry, currency, business details' },
  { label: 'Risk Policies', icon: 'ShieldAlert', description: 'Risk bands, thresholds, fraud sensitivity' },
  { label: 'Decision Policies', icon: 'Gavel', description: 'Approve, review, decline thresholds' },
  { label: 'AI Configuration', icon: 'BrainCircuit', description: 'AI agents, confidence thresholds, RAG sources' },
  { label: 'Notification Rules', icon: 'Bell', description: 'Alert thresholds, channels, escalation rules' },
  { label: 'API Configuration', icon: 'Webhook', description: 'API keys, webhooks, data pipeline settings' },
  { label: 'Security', icon: 'Lock', description: '2FA, session policies, access controls' },
  { label: 'Organization', icon: 'Settings', description: 'General organization settings' },
];
