"use client";

import { useRouter } from "next/navigation";
import { AdminDashboard } from "../../../components/admin/AdminDashboard";

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA" }}>
      {/* Admin top bar */}
      <div
        style={{
          background: "#1F2933",
          color: "#FFFFFF",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
          <span style={{ color: "#F2A900" }}>🛡️</span>
          TrustTrade Admin Portal
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#FFFFFF",
            padding: "6px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🚪 Log out
        </button>
      </div>

      {/* Dashboard content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        <AdminDashboard onSwitchToLearner={() => router.push("/")} />
      </div>
    </div>
  );
}
