"use client";

import {
  UserCog,
  ShieldCheck,
} from "lucide-react";

import {
  Card,
  PageContainer,
  PageHeader,
} from "@/components/shared/page-primitives";

import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();

  const displayName =
    user?.name || "Arjun Kapoor";

  const email =
    user?.email ||
    "admin@ledgerguard.ai";

  const role =
    user?.role ||
    "Merchant Admin";

  return (
    <PageContainer>
      <PageHeader
        title="My Profile"
        subtitle="Account identity and security posture"
        icon={UserCog}
      />

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Account Information */}
        <Card
          className="lg:col-span-2"
          title="Account information"
        >
          <div className="grid sm:grid-cols-2 gap-4 text-[12px]">

            <div>
              <span className="text-lg-muted block">
                Name
              </span>

              <span className="text-white">
                {displayName}
              </span>
            </div>

            <div>
              <span className="text-lg-muted block">
                Role
              </span>

              <span className="text-lg-blue">
                {role}
              </span>
            </div>

            <div>
              <span className="text-lg-muted block">
                Email
              </span>

              <span className="text-white">
                {email}
              </span>
            </div>

            <div>
              <span className="text-lg-muted block">
                Account status
              </span>

              <span className="text-emerald-400">
                Active
              </span>
            </div>

            <div>
              <span className="text-lg-muted block">
                Last login
              </span>

              <span className="text-white">
                Today
              </span>
            </div>

            <div>
              <span className="text-lg-muted block">
                Organization
              </span>

              <span className="text-white">
                LedgerGuard Demo Merchant
              </span>
            </div>

          </div>
        </Card>

        {/* Security Status */}
        <Card title="Security status">
          <ShieldCheck
            className="text-emerald-400 mb-3"
            size={22}
          />

          <div className="text-white text-sm">
            Protected
          </div>

          <p className="text-[11px] text-lg-muted mt-1">
            2FA enabled · Session encrypted
          </p>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid md:grid-cols-3 gap-4 mt-4">

        <Card title="Security">
          <p className="text-[11px] text-lg-muted">
            Two-factor authentication
            and password controls.
          </p>
        </Card>

        <Card title="Sessions">
          <p className="text-[11px] text-lg-muted">
            1 active session · Windows
            Chrome · Current device.
          </p>
        </Card>

        <Card title="Activity">
          <p className="text-[11px] text-lg-muted">
            Recent account and security
            activity is monitored.
          </p>
        </Card>

      </div>
    </PageContainer>
  );
}