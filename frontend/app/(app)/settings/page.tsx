"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Settings,
  User,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";

import {
  Card,
  PageContainer,
  PageHeader,
} from "@/components/shared/page-primitives";

import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const {
    user,
    updateDisplayName,
  } = useAuth();

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    saved,
    setSaved,
  ] = useState(false);

  useEffect(() => {
    setDisplayName(
      user?.name ||
        "Arjun Kapoor"
    );
  }, [user]);

  function handleSave() {
    const cleanName =
      displayName.trim();

    if (!cleanName) {
      return;
    }

    updateDisplayName(
      cleanName
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your LedgerGuard identity and security preferences"
        icon={Settings}
      />

      <div className="grid xl:grid-cols-3 gap-4">

        {/* Identity */}
        <Card
          className="xl:col-span-2"
          title="Profile identity"
        >
          <div className="space-y-5">

            {/* Display Name */}
            <div>
              <label className="text-[11px] text-lg-muted block mb-2">
                Display Name
              </label>

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <User
                    size={15}
                    className="text-lg-blue"
                  />
                </div>

                <input
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(
                      e.target.value
                    );
                    setSaved(false);
                  }}
                  placeholder="Enter your name"
                  className="flex-1 h-9 bg-white/[0.03] border border-lg rounded-md px-3 text-[12px] text-white outline-none placeholder:text-lg-dim focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                />
              </div>

              <p className="text-[10px] text-lg-dim mt-2">
                This name will appear in the LedgerGuard topbar and profile menu.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] text-lg-muted block mb-2">
                Email
              </label>

              <input
                value={
                  user?.email ||
                  "admin@ledgerguard.ai"
                }
                disabled
                className="w-full h-9 bg-white/[0.02] border border-lg rounded-md px-3 text-[12px] text-lg-muted cursor-not-allowed"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-[11px] text-lg-muted block mb-2">
                Role
              </label>

              <input
                value={
                  user?.role ||
                  "Merchant Admin"
                }
                disabled
                className="w-full h-9 bg-white/[0.02] border border-lg rounded-md px-3 text-[12px] text-lg-muted cursor-not-allowed"
              />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={
                  !displayName.trim()
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-medium transition"
              >
                <Save size={14} />

                Save Changes
              </button>

              {saved && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2
                    size={14}
                  />

                  Changes saved
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Account Status */}
        <Card
          title="Account status"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck
                size={19}
                className="text-emerald-400"
              />
            </div>

            <div>
              <div className="text-sm text-white">
                Protected
              </div>

              <div className="text-[10px] text-lg-muted">
                Account is active
              </div>
            </div>
          </div>

          <div className="space-y-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-lg-muted">
                Status
              </span>

              <span className="text-emerald-400">
                Active
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-lg-muted">
                Authentication
              </span>

              <span className="text-white">
                JWT
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-lg-muted">
                Session
              </span>

              <span className="text-white">
                Secure
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Security */}
      <div className="grid md:grid-cols-3 gap-4 mt-4">

        <Card title="Two-factor authentication">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-lg-muted">
              Additional account protection
            </span>

            <span className="text-[10px] text-emerald-400">
              ENABLED
            </span>
          </div>
        </Card>

        <Card title="Session security">
          <p className="text-[11px] text-lg-muted">
            Current browser session is authenticated using a secure JWT token.
          </p>
        </Card>

        <Card title="Access control">
          <p className="text-[11px] text-lg-muted">
            Your account currently operates with Merchant Admin permissions.
          </p>
        </Card>

      </div>
    </PageContainer>
  );
}