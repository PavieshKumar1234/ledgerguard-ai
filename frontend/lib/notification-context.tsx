'use client';

import { createContext, useContext, useEffect, useState } from 'react';
export type NotificationItem = { id: string; severity: string; title: string; description: string; time: string; route: string; read: boolean; type: string };
const seed: NotificationItem[] = [
  { id: 'N-9182', severity: 'Critical', title: 'Fraud spike detected', description: 'Transaction velocity increased 340% above baseline.', time: '2 minutes ago', route: '/risk-intelligence', type: 'Fraud spike', read: false },
  { id: 'N-9179', severity: 'High', title: 'Chargeback exposure increased', description: '₹12.50L additional exposure detected.', time: '8 minutes ago', route: '/chargebacks', type: 'Chargeback spike', read: false },
  { id: 'N-9175', severity: 'High', title: 'Suspicious device network', description: '14 accounts are connected to 7 high-risk devices.', time: '14 minutes ago', route: '/network-intelligence', type: 'Device anomaly', read: false },
  { id: 'N-9170', severity: 'Medium', title: 'Recovery opportunity identified', description: '₹4.8L recoverable revenue detected.', time: '24 minutes ago', route: '/revenue-recovery', type: 'Recovery', read: false },
  { id: 'N-9168', severity: 'System', title: 'Model evaluation completed', description: 'Risk model performance updated successfully.', time: '1 hour ago', route: '/model-intelligence', type: 'System', read: false },
];
const KEY = 'ledgerguard-demo-notifications';
const NotificationContext = createContext<{ notifications: NotificationItem[]; markRead: (id: string) => void; markAllRead: () => void; clear: (id?: string) => void } | null>(null);
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState(seed);
  useEffect(() => { const saved = localStorage.getItem(KEY); if (saved) setNotifications(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(notifications)); }, [notifications]);
  const update = (fn: (items: NotificationItem[]) => NotificationItem[]) => setNotifications(items => fn(items));
  return <NotificationContext.Provider value={{ notifications, markRead: id => update(items => items.map(n => n.id === id ? { ...n, read: true } : n)), markAllRead: () => update(items => items.map(n => ({ ...n, read: true }))), clear: id => update(items => id ? items.filter(n => n.id !== id) : []) }}>{children}</NotificationContext.Provider>;
}
export function useNotifications() { const value = useContext(NotificationContext); if (!value) throw new Error('useNotifications must be used within NotificationProvider'); return value; }
